<template>
  <div class="vacation-item" :class="{ 'vacation-item-with-user': isAdmin }">
    <div class="vacation-item-user" v-if="isAdmin && user">
      {{ user.surname }} {{ user.name }}
    </div>
    <div class="vacation-item-status">
      <Badge :type="statusC.type">{{ statusC.text }}</Badge>
    </div>
    <div class="vacation-item-total">{{ formatStats(item.totalDays) }}</div>
    <div class="vacation-item-dates">
      {{ getDateNamed(parseDate(item.startDate)) }} -
      {{ getDateNamed(parseDate(item.endDate)) }}
      {{ parseDate(item.endDate).getFullYear() }}
    </div>
    <div class="vacation-item-desc">
      {{ item.description }}
    </div>
    <div class="vacation-item-createAt">
      Создано
      <br />
      {{ parseDate(item.createdAt.Time).toLocaleDateString() }}
    </div>
    <div class="vacation-item-actions">
      <!-- <ButtonUI type="muted-accent">Подробнее</ButtonUI> -->
      <template
        v-if="isAdmin && userStore.hasPermission('vacation.all', 'edit')"
      >
        <ButtonUI
          type="success"
          @click="onApproved"
          v-if="item.status != 'approved'"
          icon="fa-regular fa-octagon-check"
          v-tooltip="'Утвердить'"
        />
        <ButtonUI
          v-if="item.status != 'pending'"
          @click="onStatus('pending')"
          type="warn"
          icon="fa-regular fa-clock"
          v-tooltip="'На рассмотрении'"
        />
        <ButtonUI
          v-if="item.status != 'rejected'"
          @click="onStatus('rejected')"
          type="destructive"
          icon="fa-regular fa-octagon-minus"
          v-tooltip="'Отклонить'"
        />
      </template>

      <template v-else>
        <ButtonUI
          v-if="item.status != 'approved'"
          @click="
            confirmModalStore.open(
              onDeleted,
              'Вы действительно хотите удалить?'
            )
          "
          type="destructive"
          icon="fa-regular fa-trash-can-xmark"
          v-tooltip="'Удалить отпуск'"
        />
      </template>

      <ButtonUI
        @click="vacationDocs.getDocument(item.id)"
        icon="fa-regular fa-file-word"
        type="success"
        v-tooltip="'Получить шаблон заявления'"
      ></ButtonUI>

      <template v-if="item.docFileName">
        <ButtonUI
          @click="onDownloadFile(item.docFileName)"
          type="muted-accent"
          icon="fa-regular fa-file-export"
          v-tooltip="'Получить прикрепленный файл'"
        />
        <ButtonUI
          v-if="userStore.hasPermission('vacation', 'file_delete')"
          @click="onDeleteFile(item.docFileName, item.id)"
          icon="fa-regular fa-file-circle-xmark"
          type="destructive"
          v-tooltip="'Удалить прикрепленный файл'"
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
            @click="$refs.fileInput.click()"
            v-tooltip="'Прикрепить файл'"
          />
          <input
            ref="fileInput"
            type="file"
            name="file"
            style="display: none"
            @change="onFileSelected"
          />
        </div>
      </template>
    </div>
    <!-- <div class="vacation-detailed"></div> -->
  </div>
</template>

<script setup>
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
import { computed } from 'vue'

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()
const vacationStore = useVacationStore()
const vacationDocs = useVacationDocs()
const { item, isAdmin } = defineProps(['item', 'isAdmin'])

const user = computed(() => {
  if (isAdmin && userStore.usersAll)
    return userStore.usersAll.find((u) => u.id == item.userId)
  else return null
})

const onApproved = async () => {
  const resp = await approvedVacationStatus(item.id)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const onDeleted = async () => {
  const resp = await deleteVacation(item.id)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const onStatus = async (status) => {
  const resp = await updateVacationStatus(item.id, status)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const onFileSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Проверка размера файла (максимум 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    notificationStore.addNotification(
      'Файл слишком большой. Максимальный размер: 10MB',
      'error'
    )
    event.target.value = ''
    return
  }

  // Проверка типа файла (разрешенные расширения)
  const allowedExtensions = ['.pdf']
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some((ext) =>
    fileName.endsWith(ext)
  )

  if (!hasValidExtension) {
    notificationStore.addNotification(
      'Недопустимый тип файла. Разрешены: PDF',
      'error'
    )
    event.target.value = ''
    return
  }

  const result = await vacationDocs.uploadFile(item.id, file)
  if (result.success) {
    notificationStore.addNotification(result.data.message, 'success')
    await vacationStore.fetchVacations()
  } else {
    notificationStore.addNotification(
      result.error || 'Ошибка при загрузке файла',
      'error'
    )
  }

  // Сброс input для возможности повторной загрузки того же файла
  event.target.value = ''
}

const onDownloadFile = async (fileName) => {
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

const onDeleteFile = async (fileName, vacationId) => {
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

const statusC = computed(() =>
  item.status == 'approved'
    ? { text: 'Утверждена', type: 'success' }
    : item.status == 'pending'
      ? { type: 'warn', text: 'На рассмотрении' }
      : { type: 'destruct', text: 'Отклонена' }
)
</script>

<style scoped>
.vacation-item {
  display: grid;
  grid-template-areas:
    'status total actions createAt'
    'dates dates actions createAt'
    'desc desc actions createAt';
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}
.vacation-item-with-user {
  grid-template-areas:
    'user user actions createAt'
    'status total actions createAt'
    'dates dates actions createAt'
    'desc desc actions createAt';
}
.vacation-item-user {
  grid-area: user;
  font-weight: 600;
  font-size: 1.2rem;
}
.vacation-item-status {
  grid-area: status;
}
.vacation-item-total {
  grid-area: total;
  color: var(--muted-text);
  font-weight: 600;
}
.vacation-item-dates {
  grid-area: dates;
  font-weight: 600;
  font-size: 1.2rem;
}
.vacation-item-desc {
  grid-area: desc;
  color: var(--muted-text);
}
.vacation-item-file {
  grid-area: file;
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  align-items: center;
}

.vacation-item-createAt {
  grid-area: createAt;
}
.vacation-item-actions {
  grid-area: actions;
  display: flex;
  flex-wrap: wrap;
  gap: 0.71rem;
}
</style>
