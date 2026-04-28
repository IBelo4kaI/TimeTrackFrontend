<template>
  <AppTable
    :headers="headers"
    :rows="rows"
    row-key="id"
    :loading="isLoading"
    empty-text="Заявки не найдены"
  >
    <template #cell-status="{ row }">
      <Badge :type="getStatus(row.status).type">
        {{ getStatus(row.status).text }}
      </Badge>
    </template>

    <template #cell-date_start="{ row }">
      <span class="dates">
        {{ getDateNamed(parseDate(row.startDate)) }}
        {{ parseDate(row.endDate).getFullYear() }}
      </span>
    </template>

    <template #cell-date_end="{ row }">
      <span class="dates">
        {{ getDateNamed(parseDate(row.endDate)) }}
        {{ parseDate(row.endDate).getFullYear() }}
      </span>
    </template>

    <template #cell-user="{ row }">
      <span v-if="getUser(row.userId)">
        {{ getUser(row.userId).surname }} {{ getUser(row.userId).name }}
      </span>
      <span v-else>—</span>
    </template>

    <template #cell-createdAt="{ row }">
      {{ parseDate(row.createdAt.Time).toLocaleDateString() }}
    </template>

    <template #actions="{ row }">
      <div class="actions">
        <template
          v-if="isAdmin && userStore.hasPermission('vacation.all', 'edit')"
        >
          <ButtonUI
            v-if="row.status != 'approved'"
            type="success"
            icon="fa-regular fa-octagon-check"
            v-tooltip="'Утвердить'"
            @click="onApproved(row.id)"
          />
          <ButtonUI
            v-if="row.status != 'pending'"
            type="warn"
            icon="fa-regular fa-clock"
            v-tooltip="'На рассмотрении'"
            @click="onStatus(row.id, 'pending')"
          />
          <ButtonUI
            v-if="row.status != 'rejected'"
            type="destructive"
            icon="fa-regular fa-octagon-minus"
            v-tooltip="'Отклонить'"
            @click="onStatus(row.id, 'rejected')"
          />
        </template>

        <template v-else>
          <ButtonUI
            v-if="row.status != 'approved'"
            type="destructive"
            icon="fa-regular fa-trash-can-xmark"
            v-tooltip="'Удалить отпуск'"
            @click="
              confirmModalStore.open(
                () => onDeleted(row.id),
                'Вы действительно хотите удалить?'
              )
            "
          />
        </template>

        <ButtonUI
          icon="fa-regular fa-file-word"
          type="success"
          v-tooltip="'Получить шаблон заявления'"
          @click="vacationDocs.getDocument(row.id)"
        />

        <template v-if="row.docFileName">
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-file-export"
            v-tooltip="'Получить прикрепленный файл'"
            @click="onDownloadFile(row.docFileName)"
          />
          <ButtonUI
            v-if="userStore.hasPermission('vacation', 'file_delete')"
            icon="fa-regular fa-file-circle-xmark"
            type="destructive"
            v-tooltip="'Удалить прикрепленный файл'"
            @click="onDeleteFile(row.docFileName, row.id)"
          />
        </template>

        <template v-else>
          <div
            class="file-upload"
            v-if="userStore.hasPermission('vacation', 'edit')"
          >
            <ButtonUI
              icon="fa-regular fa-file-import"
              type="success"
              v-tooltip="'Прикрепить файл'"
              @click="triggerFileInput(row.id)"
            />
            <input
              :ref="
                (el) => {
                  if (el) fileInputs[row.id] = el
                }
              "
              type="file"
              name="file"
              style="display: none"
              @change="onFileSelected($event, row.id)"
            />
          </div>
        </template>
      </div>
    </template>
  </AppTable>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import {
  approvedVacationStatus,
  deleteVacation,
  updateVacationStatus,
} from '@/services/vacation.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { useVacationDocs } from '@/stores/vacationDocs'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { formatStats } from '@/utils/vacation.utils'

const props = defineProps({
  items: { type: Array },
  isAdmin: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
})

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()
const vacationStore = useVacationStore()
const vacationDocs = useVacationDocs()

const fileInputs = ref({})

const rows = computed(() => props.items ?? [])

const headers = computed(() => {
  const cols = []
  if (props.isAdmin) {
    cols.push({ valueKey: 'user', title: 'Сотрудник' })
  }
  cols.push(
    { valueKey: 'status', title: 'Статус' },
    { valueKey: 'date_start', title: 'Дата начала' },
    { valueKey: 'date_end', title: 'Дата конца' },
    { valueKey: 'totalDays', title: 'Дней', format: formatStats },
    { valueKey: 'description', title: 'Комментарий' },
    { valueKey: 'createdAt', title: 'Создано' }
  )
  return cols
})

function getUser(userId) {
  return userStore.usersAll?.find((u) => u.id == userId) ?? null
}

function getStatus(status) {
  if (status === 'approved') return { text: 'Утверждена', type: 'success' }
  if (status === 'pending') return { text: 'На рассмотрении', type: 'warn' }
  return { text: 'Отклонена', type: 'destruct' }
}

function triggerFileInput(id) {
  fileInputs.value[id]?.click()
}

async function onApproved(id) {
  const resp = await approvedVacationStatus(id)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

async function onDeleted(id) {
  const resp = await deleteVacation(id)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

async function onStatus(id, status) {
  const resp = await updateVacationStatus(id, status)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

async function onFileSelected(event, id) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    notificationStore.addNotification(
      'Файл слишком большой. Максимальный размер: 10MB',
      'error'
    )
    event.target.value = ''
    return
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    notificationStore.addNotification(
      'Недопустимый тип файла. Разрешены: PDF',
      'error'
    )
    event.target.value = ''
    return
  }

  const result = await vacationDocs.uploadFile(id, file)
  if (result.success) {
    notificationStore.addNotification(result.data.message, 'success')
    await vacationStore.fetchVacations()
  } else {
    notificationStore.addNotification(
      result.error || 'Ошибка при загрузке файла',
      'error'
    )
  }
  event.target.value = ''
}

async function onDownloadFile(fileName) {
  const result = await vacationDocs.downloadFile(fileName)
  if (result.success) {
    notificationStore.addNotification(
      result.message || 'Файл успешно скачан',
      'success'
    )
  } else {
    notificationStore.addNotification(
      result.error || 'Ошибка при скачивании файла',
      'error'
    )
  }
}

async function onDeleteFile(fileName, vacationId) {
  confirmModalStore.open(async () => {
    const result = await vacationDocs.deleteFile(fileName, vacationId)
    if (result.success) {
      notificationStore.addNotification(result.data.message, 'success')
      await vacationStore.fetchVacations()
    } else {
      notificationStore.addNotification(
        result.error || 'Ошибка при удалении файла',
        'error'
      )
    }
  }, 'Вы действительно хотите удалить файл?')
}
</script>

<style scoped>
.actions {
  display: flex;
  /* flex-wrap: wrap; */
  gap: 0.35rem;
}
</style>
