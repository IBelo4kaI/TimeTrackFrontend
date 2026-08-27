<template>
  <tr class="vacation-item">
    <td>
      <div class="vacation-item__status">
        <Badge :type="statusC.type">{{ statusC.text }}</Badge>
        <Badge
          v-if="item.vacationTypeName"
          type="muted"
          :style="typeBadgeStyle"
        >
          {{ item.vacationTypeName }}
        </Badge>
      </div>
    </td>
    <td style="width: 100%">
      <div class="vacation-item__column">
        <div class="vacation-item__user" v-if="isAdmin">
          {{ user.surname }} {{ user.name }} {{ user.patronymic }}
        </div>
        <div class="vacation-item__dates">
          {{ getDateNamed(parseDate(item.startDate)) }} -
          {{ getDateNamed(parseDate(item.endDate)) }}
          {{ parseDate(item.endDate).getFullYear() }}
          <Badge type="muted" class="vacation-item__days">
            {{ formatStats(item.totalDays) }}
          </Badge>
        </div>
        <div class="vacation-item__desc">
          {{ item.description }}
        </div>
      </div>
    </td>
    <td>
      <div class="vacation-item__createAt">
        <span>Создано</span>
        <span>
          {{ parseDate(item.createdAt.Time).toLocaleDateString() }}
        </span>
      </div>
    </td>
    <td>
      <div class="vacation-item__actions">
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-arrow-up-right-from-square"
          v-tooltip="'Открыть заявку'"
          @click="onOpen"
        />
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-ellipsis"
          v-tooltip="'Ещё'"
          @click="isExtraVisible = !isExtraVisible"
        />
      </div>
    </td>
  </tr>
  <tr class="vacation-item__extra" v-if="isExtraVisible">
    <td colspan="4">
      <div class="extra__container">
        <template v-if="userStore.hasPermission('vacation.all', 'edit')">
          <ButtonUI
            type="success"
            @click="onApproved"
            v-if="item.status != 'approved' && item.status != 'rejected'"
            icon="fa-regular fa-octagon-check"
            v-tooltip="'Утвердить'"
          >
            Утвердить
          </ButtonUI>
          <ButtonUI
            v-if="item.status != 'pending'"
            @click="onStatus('pending')"
            type="warn"
            icon="fa-regular fa-clock"
            v-tooltip="'На рассмотрении'"
          >
            На рассмотрении
          </ButtonUI>
          <ButtonUI
            v-if="item.status != 'rejected'"
            @click="onStatus('rejected')"
            type="destructive"
            icon="fa-regular fa-octagon-minus"
            v-tooltip="'Отклонить'"
          >
            Отклонить
          </ButtonUI>
          <ButtonUI
            @click="
              confirmModalStore.open(
                onDeleted,
                'Вы действительно хотите удалить?'
              )
            "
            type="destructive"
            icon="fa-regular fa-trash-can-xmark"
            v-tooltip="'Удалить отпуск'"
          >
            Удалить отпуск
          </ButtonUI>
        </template>

        <template v-else>
          <ButtonUI
            v-if="item.status == 'pending'"
            @click="
              confirmModalStore.open(
                onDeleted,
                'Вы действительно хотите удалить?'
              )
            "
            type="destructive"
            icon="fa-regular fa-trash-can-xmark"
            v-tooltip="'Удалить отпуск'"
          >
            Удалить отпуск
          </ButtonUI>
        </template>

        <ButtonUI
          @click="vacationDocs.getDocument(item.id)"
          icon="fa-regular fa-file-word"
          type="success"
          v-tooltip="'Получить шаблон заявления'"
        >
          Получить шаблон заявления
        </ButtonUI>

        <!-- <template v-if="files.length">
          <ButtonUI
            @click="onDownloadFile(files[0])"
            type="muted-accent"
            icon="fa-regular fa-file-export"
            v-tooltip="'Получить прикрепленный файл'"
          >
            Получить прикрепленный файл
          </ButtonUI>
          <ButtonUI
            v-if="userStore.hasPermission('files', 'delete')"
            @click="onDeleteFile(files[0])"
            icon="fa-regular fa-file-circle-xmark"
            type="destructive"
            v-tooltip="'Удалить прикрепленный файл'"
          >
            Удалить прикрепленный файл
          </ButtonUI>
        </template> -->

        <template
          v-if="!files.length && userStore.hasPermission('vacation', 'edit')"
        >
          <ButtonUI
            icon="fa-regular fa-file-import"
            type="success"
            @click="$refs.fileInput.click()"
            v-tooltip="'Прикрепить файл'"
          >
            Прикрепить файл
          </ButtonUI>
          <input
            ref="fileInput"
            type="file"
            name="file"
            style="display: none"
            @change="onFileSelected"
          />
        </template>
      </div>
    </td>
  </tr>
</template>

<script setup>
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { deleteFile, getEntityFiles, openFile } from '@/services/files.api'
import {
  approvedVacationStatus,
  deleteVacation,
  updateVacationStatus,
  uploadVacationFile,
} from '@/services/vacation.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { useVacationDocs } from '@/stores/vacationDocs'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { formatStats } from '@/utils/vacation.utils'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()
const vacationStore = useVacationStore()
const vacationDocs = useVacationDocs()
const router = useRouter()
const { item, isAdmin } = defineProps(['item', 'isAdmin'])
const isExtraVisible = shallowRef(false)

const onOpen = () => {
  router.push({ name: 'vacation-application', params: { id: item.id } })
}

// Прикрепленные файлы отпуска (через общий файловый API)
const files = ref([])

const loadFiles = async () => {
  try {
    files.value = (await getEntityFiles('vacation', item.id)) ?? []
  } catch {
    files.value = []
  }
}

watch(() => item.id, loadFiles, { immediate: true })

const user = computed(() => {
  if (isAdmin && userStore.usersAll)
    return userStore.usersAll.find((u) => u.id == item.userId)
  else return null
})

const applicantName = computed(() =>
  [user.value?.surname, user.value?.name, user.value?.patronymic]
    .filter(Boolean)
    .join(' ')
)

const onApproved = async () => {
  const resp = await approvedVacationStatus(item.id, applicantName.value)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const onDeleted = async () => {
  const resp = await deleteVacation(item.id)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const onStatus = async (status) => {
  const resp = await updateVacationStatus(item.id, status, applicantName.value)
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

  try {
    await uploadVacationFile(item.id, file)
    notificationStore.addNotification('Файл прикреплён', 'success')
    await loadFiles()
  } catch {
    notificationStore.addNotification('Ошибка при загрузке файла', 'error')
  }

  // Сброс input для возможности повторной загрузки того же файла
  event.target.value = ''
}

const onDownloadFile = async (file) => {
  try {
    const blob = await openFile(file.id)
    const url = URL.createObjectURL(blob)
    // const a = document.createElement('a')
    // a.href = url
    // a.download = file.originalName
    // a.click()
    window.open(url, '_blank')

    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } catch {
    notificationStore.addNotification('Ошибка при открытии файла', 'error')
  }
}

const onDeleteFile = async (file) => {
  confirmModalStore.open(async () => {
    try {
      await deleteFile(file.id)
      notificationStore.addNotification('Файл удалён', 'success')
      await loadFiles()
    } catch {
      notificationStore.addNotification('Ошибка при удалении файла', 'error')
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

const typeBadgeStyle = computed(() => {
  const color = item.vacationTypeColor
  if (!color) return {}
  return {
    color,
    borderColor: color,
    background: 'transparent',
  }
})
</script>

<style scoped>
.vacation-item {
  transition: all 0.3s ease;
}

.vacation-item__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.vacation-item__actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.vacation-item__dates {
  font-weight: 600;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.vacation-item__days {
  font-size: 0.8rem;
  font-weight: 600;
}

.vacation-item__desc {
  color: var(--muted-text);
}

.vacation-item__createAt {
  display: flex;
  flex-direction: column;
}

.vacation-item__createAt span:nth-child(1) {
  font-weight: 400;
  color: var(--muted-text);
}

.vacation-item__createAt span:nth-child(2) {
  font-weight: 600;
}

.vacation-item td {
  padding: var(--padding-secondary) 0;
}

.vacation-item td:not(:last-child) {
  padding-right: var(--gap-primary);
}

.vacation-item:not(:has(+ .vacation-item__extra)) td {
  border-bottom: 0.07rem solid var(--border-color);
}

.vacation-item__extra td {
  border-bottom: 0.07rem solid var(--border-color);
  transition: all 0.3s ease;
}

.extra__container {
  display: flex;
  gap: var(--gap-primary);
  flex-wrap: wrap;
  padding: 0 0 var(--padding-secondary) 2rem;
}
</style>
