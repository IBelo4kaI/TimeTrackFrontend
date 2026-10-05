import { openFile } from '@/services/files.api'
import { useNotificationStore } from '@/stores/notification'
import { onUnmounted, ref, watch } from 'vue'

// Blob-URL содержимого файла (для iframe и «открыть в новой вкладке»).
// Перезагружается при смене файла, устаревшие ответы отбрасываются, URL
// освобождается при уходе компонента.
export function useFileBlobPreview(file) {
  const notificationStore = useNotificationStore()
  const previewUrl = ref(null)
  let blobUrl = null
  let seq = 0

  const release = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl)
      blobUrl = null
    }
    previewUrl.value = null
  }

  const load = async () => {
    const mySeq = ++seq
    release()
    if (!file.value) return

    try {
      const blob = await openFile(file.value.id)
      if (mySeq !== seq) return
      blobUrl = URL.createObjectURL(blob)
      previewUrl.value = blobUrl
    } catch {
      if (mySeq === seq) {
        notificationStore.addNotification('Ошибка при открытии файла', 'error')
      }
    }
  }

  // По id, а не по объекту: перезагрузка списка отдаёт новые объекты тех же файлов
  watch(() => file.value?.id, load)

  onUnmounted(() => {
    seq++
    release()
  })

  return { previewUrl }
}
