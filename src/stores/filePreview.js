import { openFile } from '@/services/files.api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

// Синглтон-превью файла — тот же паттерн, что confirmModal/modal.js:
// один компонент (FilePreview.vue), смонтированный в App.vue, вызывается
// откуда угодно через этот стор, а не копипастой модалки на каждой странице.
export const useFilePreviewStore = defineStore('file-preview', () => {
  const isOpen = ref(false)
  const file = ref(null) // { id, originalName, mimeType }
  const blobUrl = ref('')
  const isLoading = ref(false)
  const error = ref('')

  let revokeUrl = null

  function releaseUrl() {
    if (revokeUrl) {
      URL.revokeObjectURL(revokeUrl)
      revokeUrl = null
    }
    blobUrl.value = ''
  }

  // f: { id, originalName, mimeType } — как отдаёт GetFileByID/ListFilesByEntity,
  // тогда сами сходим за содержимым на бэк. Либо, если файла на бэке ещё нет
  // (например, фото чека, который не удалось распознать, — см. ReceiptScan.vue),
  // f: { url, originalName, mimeType } — готовый blob-url, сетевой запрос не
  // нужен; чистит его тогда сам вызывающий код, а не этот стор.
  async function open(f) {
    releaseUrl()
    file.value = f
    isOpen.value = true
    error.value = ''

    if (f.url) {
      blobUrl.value = f.url
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const blob = await openFile(f.id)
      const url = URL.createObjectURL(blob)
      revokeUrl = url
      blobUrl.value = url
    } catch {
      error.value = 'Не удалось открыть файл'
    } finally {
      isLoading.value = false
    }
  }

  function close() {
    isOpen.value = false
    file.value = null
    error.value = ''
    releaseUrl()
  }

  return { isOpen, file, blobUrl, isLoading, error, open, close }
})
