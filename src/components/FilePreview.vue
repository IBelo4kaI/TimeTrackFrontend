<template>
  <div v-if="store.isOpen" class="file-preview">
    <div class="file-preview__back" @click="store.close()"></div>

    <div class="file-preview__container">
      <div class="file-preview__header">
        <span class="file-preview__name">{{ store.file?.originalName }}</span>

        <div class="file-preview__actions">
          <a
            v-if="store.blobUrl"
            :href="store.blobUrl"
            target="_blank"
            rel="noopener"
            class="file-preview__action"
            v-tooltip="'Открыть в новой вкладке'"
          >
            <i class="fa-regular fa-arrow-up-right-from-square"></i>
          </a>
          <button
            type="button"
            class="file-preview__action"
            @click="store.close()"
            v-tooltip="'Закрыть'"
          >
            <i class="fa-regular fa-xmark"></i>
          </button>
        </div>
      </div>

      <div class="file-preview__body">
        <div v-if="store.isLoading" class="file-preview__state">
          <LoaderTitle />
        </div>

        <div v-else-if="store.error" class="file-preview__state">
          {{ store.error }}
        </div>

        <img
          v-else-if="isImage"
          :src="store.blobUrl"
          :alt="store.file?.originalName"
          class="file-preview__image"
        />

        <iframe
          v-else-if="isPdf"
          :src="store.blobUrl"
          class="file-preview__frame"
          :title="store.file?.originalName"
        ></iframe>

        <div v-else class="file-preview__state">
          <i class="fa-regular fa-file"></i>
          <span>Предпросмотр недоступен для этого типа файла</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted } from 'vue'
import LoaderTitle from './Loader/LoaderTitle.vue'
import { useFilePreviewStore } from '@/stores/filePreview'

const store = useFilePreviewStore()

const isImage = computed(() => store.file?.mimeType?.startsWith('image/'))
const isPdf = computed(() => store.file?.mimeType === 'application/pdf')

function onKeydown(e) {
  if (e.key === 'Escape' && store.isOpen) store.close()
}
document.addEventListener('keydown', onKeydown)
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.file-preview {
  display: flex;
  align-items: center;
  justify-content: center;

  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  z-index: 100;
  animation: filePreviewIn 0.2s ease;
}

.file-preview__back {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  /* Тот же фон, что у ModalLayout.vue — единый вид всех оверлеев в приложении. */
  background: #9c9c9c50;

  z-index: 99;
}

.file-preview__container {
  position: relative;
  z-index: 101;

  display: flex;
  flex-direction: column;
  gap: 0.86rem;

  padding: 1.14rem;

  background: var(--foreground);
  border-radius: var(--border-radius);

  width: calc(100% - 2rem);
  max-width: 60rem;
  height: calc(100% - 4rem);
  max-height: 46rem;

  margin: 1rem;
}

.file-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.86rem;
}

.file-preview__name {
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-preview__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.file-preview__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.5rem;
  color: var(--muted-text);
  cursor: pointer;
}

.file-preview__action:hover {
  background: var(--muted-foreground);
  color: var(--text);
}

.file-preview__body {
  flex: 1;
  min-height: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background: var(--background);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.file-preview__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.file-preview__frame {
  width: 100%;
  height: 100%;
  border: none;
}

.file-preview__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--muted-text);
}

.file-preview__state i {
  font-size: 2rem;
}

@keyframes filePreviewIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .file-preview__container {
    width: calc(100% - 1rem);
    height: calc(100% - 2rem);
    max-height: none;
    margin: 0.5rem;
  }
}
</style>
