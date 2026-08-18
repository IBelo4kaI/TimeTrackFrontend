<template>
  <div class="viewer-page">
    <div class="viewer-topbar">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>

      <span v-if="file" class="viewer-name">
        <i class="fa-regular fa-file-pdf"></i>
        {{ file.originalName }}
      </span>

      <div class="viewer-actions">
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-circle-info"
          v-tooltip="'Информация о заявке'"
          @click="onOpenInfo"
        />
        <ButtonUI
          v-if="file"
          type="muted-accent"
          icon="fa-regular fa-arrow-up-right-from-square"
          v-tooltip="'Открыть в новой вкладке'"
          @click="onOpenInNewTab"
        />
      </div>
    </div>

    <div class="viewer-body">
      <div v-if="isLoading" class="viewer-state">
        <LoaderTitle />
      </div>
      <div v-else-if="!file" class="viewer-state">
        <i class="fa-regular fa-file-pdf"></i>
        <span>К заявке не прикреплён файл</span>
      </div>
      <iframe
        v-else-if="previewUrl"
        :src="previewUrl"
        class="viewer-frame"
        title="Заявление на отпуск"
      ></iframe>
      <div v-else class="viewer-state">
        <LoaderTitle />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { getEntityFiles, openFile } from '@/services/files.api'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

// Страница без сайдбара/шапки (meta.layout: 'full', см. router/index.js и
// App.vue) — «Назад» ведёт туда, откуда реально пришли (таблица документов),
// а не жёстко на конкретную страницу.
function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'docs' })
  }
}

function onOpenInfo() {
  router.push({ name: 'vacation-application', params: { id: route.params.id } })
}

const files = ref([])
const file = ref(null)
const isLoading = ref(false)

const previewUrl = ref(null)
let previewBlobUrl = null

async function loadFile() {
  isLoading.value = true
  try {
    files.value = (await getEntityFiles('vacation', route.params.id)) ?? []
    file.value = files.value[0] ?? null
  } catch {
    files.value = []
    file.value = null
    notificationStore.addNotification('Не удалось загрузить файл', 'error')
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

function onOpenInNewTab() {
  if (previewUrl.value) window.open(previewUrl.value, '_blank')
}

watch(file, loadPreview)
watch(() => route.params.id, loadFile)

onMounted(loadFile)
onUnmounted(releasePreview)
</script>

<style scoped>
.viewer-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background);
}

.viewer-topbar {
  display: flex;
  align-items: center;
  gap: var(--gap-primary);
  padding: 0.71rem var(--padding-primary);
  background: var(--foreground);
  border-bottom: 0.07rem solid var(--border-color);
  flex-shrink: 0;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  color: var(--muted-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.back-link:hover {
  color: var(--accent);
}

.viewer-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-actions {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.viewer-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.viewer-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--muted-text);
}

.viewer-state i {
  font-size: 2rem;
}

.viewer-frame {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: none;
}
</style>
