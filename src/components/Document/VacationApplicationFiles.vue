<template>
  <div class="files">
    <div class="files__state" v-if="isLoading">
      <LoaderTitle />
    </div>

    <div class="files__state" v-else-if="!file">
      <i class="fa-regular fa-file-pdf"></i>
      <span>К заявке пока не прикреплён файл</span>
      <ButtonUI
        v-if="canManage"
        icon="fa-regular fa-file-import"
        type="success"
        @click="fileInput.click()"
      >
        Прикрепить файл
      </ButtonUI>
    </div>

    <div class="files__viewer" v-else>
      <div class="files__toolbar">
        <span class="files__name">
          <i class="fa-regular fa-file-pdf"></i>
          {{ file.originalName }}
        </span>
        <div class="files__actions">
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-arrow-up-right-from-square"
            v-tooltip="'Открыть в новой вкладке'"
            @click="onOpenInNewTab"
          />
          <ButtonUI
            v-if="canManage"
            type="muted-accent"
            icon="fa-regular fa-arrows-rotate"
            v-tooltip="'Заменить файл'"
            @click="fileInput.click()"
          />
          <ButtonUI
            v-if="canDelete"
            type="destructive"
            icon="fa-regular fa-trash-can-xmark"
            v-tooltip="'Удалить файл'"
            @click="onDeleteFile"
          />
        </div>
      </div>

      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        class="files__frame"
        title="Заявление на отпуск"
      ></iframe>
      <div class="files__state" v-else>
        <LoaderTitle />
      </div>
    </div>

    <input
      v-if="canManage"
      ref="fileInput"
      type="file"
      style="display: none"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ButtonUI from '../ButtonUI.vue'
import LoaderTitle from '../Loader/LoaderTitle.vue'
import { deleteFile, getEntityFiles, openFile } from '@/services/files.api'
import { uploadVacationFile } from '@/services/vacation.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  vacationId: { type: String, required: true },
  vacation: { type: Object, default: null },
})

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()

// Зеркалит бэк (RequireOwnerOrAll в UploadVacationFile, см.
// internal/vacation/handler.go): свою заявку можно дополнить файлом при
// базовом vacation:edit, чужую — только с vacation.all:edit. Раньше тут
// проверялся только базовый vacation:edit без учёта владельца — кнопка
// "Прикрепить" была видна и на чужих заявках, хотя бэк такой запрос уже
// отклонял.
const canManage = computed(() => {
  if (userStore.hasPermission('vacation.all', 'edit')) return true
  if (!userStore.hasPermission('vacation', 'edit')) return false
  return props.vacation?.userId === userStore.user?.id
})
const canDelete = computed(() => userStore.hasPermission('files', 'delete'))

const files = ref([])
const file = computed(() => files.value[0] ?? null)
const isLoading = ref(false)
const fileInput = ref(null)

// Object URL для встроенного просмотра (стандартный PDF-вьюер браузера в
// iframe) и «открыть в новой вкладке» — используются оба из одного и того
// же URL.
const previewUrl = ref(null)
let previewBlobUrl = null

async function loadFiles() {
  isLoading.value = true
  try {
    files.value = (await getEntityFiles('vacation', props.vacationId)) ?? []
  } catch {
    files.value = []
    notificationStore.addNotification(
      'Не удалось загрузить прикреплённый файл',
      'error'
    )
  } finally {
    isLoading.value = false
  }
}

async function loadPreview() {
  releasePreview()
  if (!file.value) return

  try {
    const blob = await openFile(file.value.id)
    previewBlobUrl = URL.createObjectURL(blob)
    previewUrl.value = previewBlobUrl
  } catch {
    notificationStore.addNotification('Ошибка при открытии файла', 'error')
  }
}

function releasePreview() {
  if (previewBlobUrl) {
    URL.revokeObjectURL(previewBlobUrl)
    previewBlobUrl = null
  }
  previewUrl.value = null
}

watch(file, loadPreview)
watch(
  () => props.vacationId,
  () => loadFiles()
)

onMounted(loadFiles)
onUnmounted(releasePreview)

function onOpenInNewTab() {
  if (previewUrl.value) window.open(previewUrl.value, '_blank')
}

async function onFileSelected(event) {
  const selected = event.target.files[0]
  if (!selected) return

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (selected.size > maxSize) {
    notificationStore.addNotification(
      'Файл слишком большой. Максимальный размер: 10MB',
      'error'
    )
    event.target.value = ''
    return
  }

  if (!selected.name.toLowerCase().endsWith('.pdf')) {
    notificationStore.addNotification(
      'Недопустимый тип файла. Разрешены: PDF',
      'error'
    )
    event.target.value = ''
    return
  }

  // Если файл уже был — это замена: сохраняем id старого, чтобы удалить его
  // ПОСЛЕ успешной загрузки нового (а не до — если загрузка упадёт, старый
  // файл не потеряется).
  const previousFileId = file.value?.id ?? null
  const isReplacing = previousFileId != null

  try {
    await uploadVacationFile(props.vacationId, selected)

    if (isReplacing) {
      try {
        await deleteFile(previousFileId)
      } catch {
        notificationStore.addNotification(
          'Новый файл загружен, но не удалось удалить предыдущий',
          'warning'
        )
      }
    }

    notificationStore.addNotification(
      isReplacing ? 'Файл заменён' : 'Файл прикреплён',
      'success'
    )
    await loadFiles()
  } catch {
    notificationStore.addNotification('Ошибка при загрузке файла', 'error')
  }

  event.target.value = ''
}

function onDeleteFile() {
  confirmModalStore.open(async () => {
    try {
      await deleteFile(file.value.id)
      notificationStore.addNotification('Файл удалён', 'success')
      await loadFiles()
    } catch {
      notificationStore.addNotification('Ошибка при удалении файла', 'error')
    }
  }, 'Удалить прикреплённый файл?')
}
</script>

<style scoped>
.files {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.files__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem var(--padding-primary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  color: var(--muted-text);
  flex: 1;
}

.files__state i {
  font-size: 2rem;
}

.files__viewer {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  flex: 1;
  min-height: 40rem;
}

.files__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-primary);
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.files__name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.files__actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.files__frame {
  flex: 1;
  width: 100%;
  min-height: 40rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--foreground);
}
</style>
