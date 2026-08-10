<template>
  <div class="pdf-viewer">
    <div class="pdf-viewer__toolbar">
      <div class="pdf-viewer__group">
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-chevron-left"
          v-tooltip="'Предыдущая страница'"
          :disabled="page <= 1"
          @click="prevPage"
        />
        <span class="pdf-viewer__page">{{ page }} / {{ numPages || '—' }}</span>
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-chevron-right"
          v-tooltip="'Следующая страница'"
          :disabled="page >= numPages"
          @click="nextPage"
        />
      </div>

      <div class="pdf-viewer__group">
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-magnifying-glass-minus"
          v-tooltip="'Уменьшить'"
          :disabled="scale <= MIN_SCALE"
          @click="zoomOut"
        />
        <span class="pdf-viewer__zoom">{{ Math.round(scale * 100) }}%</span>
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-magnifying-glass-plus"
          v-tooltip="'Увеличить'"
          :disabled="scale >= MAX_SCALE"
          @click="zoomIn"
        />
      </div>
    </div>

    <div class="pdf-viewer__body" ref="bodyRef">
      <div class="pdf-viewer__state" v-if="isLoading">
        <LoaderTitle />
      </div>
      <div class="pdf-viewer__state" v-else-if="error">
        <i class="fa-regular fa-triangle-exclamation"></i>
        <span>{{ error }}</span>
      </div>
      <canvas
        v-show="!isLoading && !error"
        ref="canvasRef"
        class="pdf-viewer__canvas"
      />
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import ButtonUI from './ButtonUI.vue'
import LoaderTitle from './Loader/LoaderTitle.vue'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MIN_SCALE = 0.4
const MAX_SCALE = 3
const SCALE_STEP = 0.2
// "Читаемая" ширина страницы при 100% — примерно как у листа A4 на экране,
// а не во всю ширину контейнера (иначе на широких мониторах документ
// растягивается неоправданно крупно).
const DEFAULT_PAGE_WIDTH = 720

const props = defineProps({
  // Файл как Blob (например, из openFile() в services/files.api.js).
  blob: { type: Blob, default: null },
})

const bodyRef = ref(null)
const canvasRef = ref(null)

const isLoading = ref(false)
const error = ref('')
const page = ref(1)
const numPages = ref(0)
// scale=1 означает "по ширине контейнера", а не "100% исходного PDF" —
// так удобнее пользователю, чем ориентироваться на реальный масштаб документа.
const scale = ref(1)

// pdfDoc (PDFDocumentProxy, результат loadingTask.promise) — для рендера
// страниц. loadingTask (PDFDocumentLoadingTask, то, что возвращает
// getDocument() ДО .promise) — только у него есть .destroy(), у самого
// pdfDoc такого метода нет (и не было в v6 pdfjs-dist).
let pdfDoc = null
let loadingTask = null
let renderTask = null
let resizeTimeout = null

async function loadDocument() {
  cleanupDoc()
  error.value = ''
  numPages.value = 0
  page.value = 1
  scale.value = 1

  if (!props.blob) return

  isLoading.value = true
  try {
    const buffer = await props.blob.arrayBuffer()
    loadingTask = pdfjsLib.getDocument({ data: buffer })
    pdfDoc = await loadingTask.promise
    numPages.value = pdfDoc.numPages
    await nextTick()
    await renderPage()
  } catch (e) {
    console.error('Ошибка при открытии PDF:', e)
    error.value = 'Не удалось открыть файл'
  } finally {
    isLoading.value = false
  }
}

async function renderPage() {
  if (!pdfDoc || !canvasRef.value) return

  const pdfPage = await pdfDoc.getPage(page.value)

  const containerWidth = bodyRef.value?.clientWidth ?? 800
  const unscaledViewport = pdfPage.getViewport({ scale: 1 })
  // 100% зума = не во всю ширину контейнера, а разумный "читаемый" размер
  // страницы (как лист документа), но не шире контейнера на узких экранах.
  const targetWidth = Math.min(containerWidth - 32, DEFAULT_PAGE_WIDTH)
  const fitScale = Math.max(targetWidth / unscaledViewport.width, 0.1)
  const viewport = pdfPage.getViewport({ scale: fitScale * scale.value })

  const canvas = canvasRef.value
  const context = canvas.getContext('2d')
  canvas.width = viewport.width
  canvas.height = viewport.height

  if (renderTask) renderTask.cancel()
  renderTask = pdfPage.render({ canvasContext: context, viewport })
  try {
    await renderTask.promise
  } catch (e) {
    if (e?.name !== 'RenderingCancelledException') throw e
  }
}

function cleanupDoc() {
  if (renderTask) {
    renderTask.cancel()
    renderTask = null
  }
  pdfDoc = null
  if (loadingTask) {
    // .destroy() возвращает промис — ошибки тут не критичны (документ и так
    // выбрасывается), просто не даём им улететь необработанными.
    loadingTask.destroy().catch(() => {})
    loadingTask = null
  }
}

function prevPage() {
  if (page.value > 1) page.value -= 1
}

function nextPage() {
  if (page.value < numPages.value) page.value += 1
}

function zoomIn() {
  scale.value = Math.min(scale.value + SCALE_STEP, MAX_SCALE)
}

function zoomOut() {
  scale.value = Math.max(scale.value - SCALE_STEP, MIN_SCALE)
}

function onResize() {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(renderPage, 150)
}

watch(() => props.blob, loadDocument)
watch(page, renderPage)
watch(scale, renderPage)

onMounted(() => {
  loadDocument()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  clearTimeout(resizeTimeout)
  cleanupDoc()
})
</script>

<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}

.pdf-viewer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--gap-primary);
  padding: calc(var(--padding-secondary) / 2) var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.pdf-viewer__group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pdf-viewer__page,
.pdf-viewer__zoom {
  min-width: 3.5rem;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--muted-text);
}

.pdf-viewer__body {
  flex: 1;
  min-height: 40rem;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 1rem;
  background: var(--muted-foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.pdf-viewer__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: auto;
  color: var(--muted-text);
}

.pdf-viewer__state i {
  font-size: 2rem;
}

.pdf-viewer__canvas {
  max-width: 100%;
  height: fit-content;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-radius: calc(var(--border-radius) * 0.5);
}
</style>
