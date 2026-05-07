<template>
  <AppTable
    :headers="headers"
    :rows="rows"
    row-key="id"
    :loading="isLoading"
    empty-text="Больничные не найдены"
  >
    <template #cell-status="{ row }">
      <Badge :type="getStatus(row.status).type">
        {{ getStatus(row.status).text }}
      </Badge>
    </template>

    <template #cell-date_start="{ row }">
      <span>{{ getDateNamed(parseDate(row.startDate)) }} {{ parseDate(row.startDate).getFullYear() }}</span>
    </template>

    <template #cell-date_end="{ row }">
      <span>{{ getDateNamed(parseDate(row.endDate)) }} {{ parseDate(row.endDate).getFullYear() }}</span>
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
        <template v-if="isAdmin && userStore.hasPermission('sick_leaves', 'edit')">
          <ButtonUI
            v-if="row.status !== 'official'"
            type="success"
            icon="fa-regular fa-file-certificate"
            v-tooltip="'Официальный больничный'"
            @click="onStatus(row.id, 'official')"
          />
          <ButtonUI
            v-if="row.status !== 'unofficial'"
            type="warn"
            icon="fa-regular fa-file-slash"
            v-tooltip="'Неофициальный больничный'"
            @click="onStatus(row.id, 'unofficial')"
          />
        </template>

        <ButtonUI
          type="destructive"
          icon="fa-regular fa-trash-can-xmark"
          v-tooltip="'Удалить'"
          @click="confirmModalStore.open(() => onDeleted(row.id), 'Удалить больничный? Записи в табеле также будут удалены.')"
        />

        <template v-if="filesMap[row.id]?.length">
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-file-export"
            v-tooltip="'Скачать прикрепленный файл'"
            @click="onDownloadFile(filesMap[row.id][0])"
          />
          <ButtonUI
            v-if="userStore.hasPermission('files', 'delete')"
            type="destructive"
            icon="fa-regular fa-file-circle-xmark"
            v-tooltip="'Удалить прикрепленный файл'"
            @click="onDeleteFile(filesMap[row.id][0], row.id)"
          />
        </template>

        <template v-else>
          <div class="file-upload" v-if="userStore.hasPermission('sick_leaves', 'edit')">
            <ButtonUI
              icon="fa-regular fa-file-import"
              type="success"
              v-tooltip="'Прикрепить файл'"
              @click="triggerFileInput(row.id)"
            />
            <input
              :ref="(el) => { if (el) fileInputs[row.id] = el }"
              type="file"
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
import { computed, ref, watch } from 'vue'
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { deleteSickLeave, updateSickLeaveStatus, uploadSickLeaveFile } from '@/services/sick_leave.api'
import { deleteFile, getEntityFiles, openFile } from '@/services/files.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useSickLeaveStore } from '@/stores/sick_leave'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'

const props = defineProps({
  items: { type: Array },
  isAdmin: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
})

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()
const sickLeaveStore = useSickLeaveStore()

const fileInputs = ref({})
const filesMap = ref({})
const rows = computed(() => props.items ?? [])

async function loadFiles() {
  const items = props.items ?? []
  const results = await Promise.all(
    items.map(async (item) => {
      try {
        const files = await getEntityFiles('sick_leave', item.id)
        return [item.id, files ?? []]
      } catch {
        return [item.id, []]
      }
    })
  )
  filesMap.value = Object.fromEntries(results)
}

watch(() => props.items, loadFiles, { immediate: true })

const headers = computed(() => {
  const cols = []
  if (props.isAdmin) cols.push({ valueKey: 'user', title: 'Сотрудник' })
  cols.push(
    { valueKey: 'status', title: 'Статус' },
    { valueKey: 'date_start', title: 'Дата начала' },
    { valueKey: 'date_end', title: 'Дата конца' },
    { valueKey: 'totalDays', title: 'Дней' },
    { valueKey: 'description', title: 'Комментарий' },
    { valueKey: 'createdAt', title: 'Создано' }
  )
  return cols
})

function getUser(userId) {
  return userStore.usersAll?.find((u) => u.id == userId) ?? null
}

function getStatus(status) {
  if (status === 'official') return { text: 'Официальный', type: 'success' }
  return { text: 'Неофициальный', type: 'warn' }
}

function triggerFileInput(id) {
  fileInputs.value[id]?.click()
}

async function onStatus(id, status) {
  try {
    await updateSickLeaveStatus(id, status)
    notificationStore.addNotification('Статус обновлён', 'success')
    await sickLeaveStore.fetchSickLeaves()
  } catch {
    notificationStore.addNotification('Ошибка при обновлении статуса', 'error')
  }
}

async function onDeleted(id) {
  try {
    await deleteSickLeave(id)
    notificationStore.addNotification('Больничный удалён', 'success')
    await sickLeaveStore.fetchSickLeaves()
  } catch {
    notificationStore.addNotification('Ошибка при удалении', 'error')
  }
}

async function onFileSelected(event, id) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    notificationStore.addNotification('Файл слишком большой. Максимум: 10MB', 'error')
    event.target.value = ''
    return
  }

  try {
    await uploadSickLeaveFile(id, file)
    notificationStore.addNotification('Файл прикреплён', 'success')
    await sickLeaveStore.fetchSickLeaves()
  } catch {
    notificationStore.addNotification('Ошибка при загрузке файла', 'error')
  }
  event.target.value = ''
}

async function onDownloadFile(file) {
  try {
    const blob = await openFile(file.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.originalName
    a.click()
    URL.revokeObjectURL(url)
    notificationStore.addNotification('Файл скачан', 'success')
  } catch {
    notificationStore.addNotification('Ошибка при скачивании файла', 'error')
  }
}

async function onDeleteFile(file, sickLeaveId) {
  confirmModalStore.open(async () => {
    try {
      await deleteFile(file.id)
      notificationStore.addNotification('Файл удалён', 'success')
      await sickLeaveStore.fetchSickLeaves()
    } catch {
      notificationStore.addNotification('Ошибка при удалении файла', 'error')
    }
  }, 'Удалить прикреплённый файл?')
}
</script>

<style scoped>
.actions {
  display: flex;
  gap: 0.35rem;
}
</style>
