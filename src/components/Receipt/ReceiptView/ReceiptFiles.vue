<template>
  <div class="files">
    <div class="files__toolbar">
      <span class="files__count">Файлы чека ({{ files.length }})</span>
      <template v-if="canManage">
        <ButtonUI
          icon="fa-regular fa-file-import"
          type="success"
          @click="fileInput.click()"
        >
          Прикрепить файл
        </ButtonUI>
        <input
          ref="fileInput"
          type="file"
          accept="image/*,.pdf"
          multiple
          style="display: none"
          @change="onFilesSelected"
        />
      </template>
    </div>

    <div class="files__state" v-if="isLoading">
      <LoaderTitle />
    </div>

    <div class="files__state" v-else-if="!files.length">
      <i class="fa-regular fa-receipt"></i>
      <span>К чеку пока не прикреплены файлы</span>
    </div>

    <div class="files__grid" v-else>
      <div class="file-card" v-for="f in files" :key="f.id">
        <div class="file-card__preview" @click="onOpen(f)">
          <img
            v-if="isImage(f) && previewUrls[f.id]"
            :src="previewUrls[f.id]"
            :alt="f.originalName"
          />
          <i v-else-if="isImage(f)" class="fa-regular fa-spinner fa-spin"></i>
          <i v-else class="fa-regular fa-file-pdf"></i>
        </div>
        <div class="file-card__name" :title="f.originalName">
          {{ f.originalName }}
        </div>
        <ButtonUI
          v-if="canDelete"
          type="destructive"
          icon="fa-regular fa-trash-can-xmark"
          v-tooltip="'Удалить файл'"
          @click="onDeleteFile(f)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { deleteFile, getEntityFiles, openFile } from '@/services/files.api'
import { uploadReceiptFile } from '@/services/receipt.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  receiptId: { type: String, required: true },
  receipt: { type: Object, default: null },
})

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()

// зеркалит RequireOwnerOrAll в UploadReceiptFile на бэке (см.
// internal/receipt/handler.go): свой чек можно дополнить файлом при
// базовом receipts:edit, чужой — только с receipts.all:edit
const canManage = computed(() => {
  if (userStore.hasPermission('receipts.all', 'edit')) return true
  if (!userStore.hasPermission('receipts', 'edit')) return false
  return props.receipt?.userId === userStore.user?.id
})
const canDelete = computed(() => userStore.hasPermission('files', 'delete'))

const files = ref([])
const isLoading = ref(false)
const fileInput = ref(null)

// blob-урлы только для картинок (превью в сетке); pdf грузим по клику, чтобы
// не тянуть все сканы сразу
const previewUrls = reactive({})
const isImage = (f) => f.mimeType?.startsWith('image/')

async function loadFiles() {
  isLoading.value = true
  try {
    files.value = (await getEntityFiles('receipt', props.receiptId)) ?? []
  } catch {
    files.value = []
    notificationStore.addNotification(
      'Не удалось загрузить файлы чека',
      'error'
    )
  } finally {
    isLoading.value = false
  }
  await loadImagePreviews()
}

async function loadImagePreviews() {
  for (const f of files.value) {
    if (!isImage(f) || previewUrls[f.id]) continue
    try {
      const blob = await openFile(f.id)
      previewUrls[f.id] = URL.createObjectURL(blob)
    } catch {
      // не критично — просто останется иконка вместо превью
    }
  }
}

function releasePreviews() {
  Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url))
  Object.keys(previewUrls).forEach((key) => delete previewUrls[key])
}

watch(
  () => props.receiptId,
  () => {
    releasePreviews()
    loadFiles()
  }
)

onMounted(loadFiles)
onUnmounted(releasePreviews)

async function onOpen(f) {
  if (previewUrls[f.id]) {
    window.open(previewUrls[f.id], '_blank')
    return
  }

  try {
    const blob = await openFile(f.id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } catch {
    notificationStore.addNotification('Ошибка при открытии файла', 'error')
  }
}

async function onFilesSelected(event) {
  const selected = Array.from(event.target.files ?? [])
  if (!selected.length) return

  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.heic']

  for (const file of selected) {
    if (file.size > maxSize) {
      notificationStore.addNotification(
        `${file.name}: файл слишком большой (максимум 10MB)`,
        'error'
      )
      continue
    }

    const fileName = file.name.toLowerCase()
    if (!allowedExtensions.some((ext) => fileName.endsWith(ext))) {
      notificationStore.addNotification(
        `${file.name}: недопустимый тип файла`,
        'error'
      )
      continue
    }

    try {
      await uploadReceiptFile(props.receiptId, file)
    } catch {
      notificationStore.addNotification(
        `${file.name}: ошибка при загрузке`,
        'error'
      )
    }
  }

  notificationStore.addNotification('Файлы обновлены', 'success')
  await loadFiles()

  event.target.value = ''
}

function onDeleteFile(f) {
  confirmModalStore.open(async () => {
    try {
      await deleteFile(f.id)
      if (previewUrls[f.id]) {
        URL.revokeObjectURL(previewUrls[f.id])
        delete previewUrls[f.id]
      }
      notificationStore.addNotification('Файл удалён', 'success')
      await loadFiles()
    } catch {
      notificationStore.addNotification('Ошибка при удалении файла', 'error')
    }
  }, 'Удалить этот файл?')
}
</script>

<style scoped>
.files {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}

.files__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-primary);
}

.files__count {
  font-weight: 600;
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
}

.files__state i {
  font-size: 2rem;
}

.files__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: var(--gap-primary);
}

.file-card {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 0.5rem;
}

.file-card__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 8rem;
  background: var(--background);
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
  color: var(--muted-text);
  font-size: 1.7rem;
}

.file-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-card__name {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
