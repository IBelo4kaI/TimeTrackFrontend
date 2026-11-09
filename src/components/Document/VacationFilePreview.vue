<template>
  <Teleport to="body">
    <dialog ref="dialog" class="preview" aria-labelledby="preview-title" @cancel.prevent="emit('close')" @keydown="onKeydown" @click.self="emit('close')">
      <header class="preview-header">
        <h2 id="preview-title">{{ currentFile?.originalName || 'Предпросмотр файла' }}</h2>
        <a v-if="blobUrl" class="download" :href="blobUrl" :download="currentFile?.originalName">Скачать</a>
        <button class="icon-button" type="button" aria-label="Закрыть предпросмотр" autofocus @click="emit('close')"><i class="fa-regular fa-xmark" aria-hidden="true"></i></button>
      </header>
      <div class="preview-layout" :class="{ 'single-file': files.length < 2 }" @click.self="emit('close')">
        <aside v-if="files.length > 1" class="other-files" aria-label="Другие файлы заявки">
          <h3>Файлы заявки</h3>
          <button v-for="file in files" :key="file.id" type="button" class="file-choice" :class="{ selected: file.id === currentFile?.id }" :aria-pressed="file.id === currentFile?.id" @click="selectedId = file.id">
            <span class="file-sheet"><i class="fa-regular fa-file" aria-hidden="true"></i><small>{{ extension(file) }}</small></span>
            <span class="file-name">{{ file.originalName }}</span>
          </button>
        </aside>
        <div class="document-area" @click.self="emit('close')">
          <div ref="stage" class="document-stage" :aria-busy="loading || rendering" @click.self="emit('close')">
            <div v-if="loading" class="preview-state" role="status">Загрузка файла…</div>
            <div v-else-if="error" class="preview-state" role="alert"><p>{{ error }}</p><button type="button" @click="loadFile">Повторить</button></div>
            <template v-else-if="isPdf">
              <canvas ref="canvas" class="pdf-page" :class="{ invisible: rendering }" :aria-label="`Страница ${pageNumber} из ${pageCount}`"></canvas>
              <span v-if="rendering" class="render-state" role="status">Загрузка страницы…</span>
            </template>
            <img v-else-if="isImage && blobUrl" :src="blobUrl" :alt="currentFile?.originalName" class="image-page" @error="error = 'Не удалось отобразить изображение'" />
            <div v-else class="preview-state"><i class="fa-regular fa-file" aria-hidden="true"></i><p>Предпросмотр этого формата недоступен.</p><a v-if="blobUrl" :href="blobUrl" :download="currentFile?.originalName">Скачать файл</a></div>
          </div>
          <nav v-if="isPdf && pageCount > 0 && !loading && !error" class="page-navigation" aria-label="Страницы файла">
            <button type="button" class="icon-button" :disabled="pageNumber === 1" aria-label="Предыдущая страница" @click="pageNumber--"><i class="fa-regular fa-chevron-left" aria-hidden="true"></i></button>
            <div class="page-list">
              <button v-for="page in visiblePages" :key="page" type="button" class="page-choice" :class="{ selected: page === pageNumber }" :aria-current="page === pageNumber ? 'page' : undefined" :aria-label="`Страница ${page}`" @click="pageNumber = page"><i class="fa-regular fa-file-lines" aria-hidden="true"></i><span>{{ page }}</span></button>
            </div>
            <button type="button" class="icon-button" :disabled="pageNumber === pageCount" aria-label="Следующая страница" @click="pageNumber++"><i class="fa-regular fa-chevron-right" aria-hidden="true"></i></button>
            <label class="page-jump">Страница <input type="number" :value="pageNumber" min="1" :max="pageCount" @change="jumpToPage" /> из {{ pageCount }}</label>
          </nav>
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { openFile } from '@/services/files.api'

GlobalWorkerOptions.workerSrc = workerUrl
const props = defineProps({ files: { type: Array, required: true }, initialFileId: { type: String, required: true } })
const emit = defineEmits(['close'])
const dialog = ref(null)
const stage = ref(null)
const canvas = ref(null)
const selectedId = ref(props.initialFileId)
const currentFile = computed(() => props.files.find((file) => file.id === selectedId.value) ?? props.files[0])
const extension = (file) => file?.originalName?.split('.').pop()?.toUpperCase() || 'ФАЙЛ'
const isPdf = computed(() => currentFile.value?.mimeType === 'application/pdf' || extension(currentFile.value) === 'PDF')
const isImage = computed(() => currentFile.value?.mimeType?.startsWith('image/') || /^(PNG|JPE?G|GIF|WEBP)$/.test(extension(currentFile.value)))
const loading = ref(true)
const rendering = ref(false)
const error = ref('')
const blobUrl = ref('')
const pageNumber = ref(1)
const pageCount = ref(0)
const visiblePages = computed(() => {
  const start = Math.max(1, Math.min(pageNumber.value - 3, pageCount.value - 6))
  return Array.from({ length: Math.min(7, pageCount.value) }, (_, index) => start + index)
})
let pdf = null
let loadingTask = null
let renderTask = null
let generation = 0
let renderGeneration = 0
let resizeObserver
let resizeFrame
let previousOverflow

function release() {
  renderGeneration++
  renderTask?.cancel()
  renderTask = null
  loadingTask?.destroy()?.catch(() => {})
  loadingTask = null
  pdf = null
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
  blobUrl.value = ''
}
async function loadFile() {
  const current = ++generation
  release()
  loading.value = true
  rendering.value = false
  error.value = ''
  pageNumber.value = 1
  pageCount.value = 0
  if (!currentFile.value) { loading.value = false; error.value = 'Файл не найден'; return }
  try {
    const blob = await openFile(currentFile.value.id)
    if (current !== generation) return
    blobUrl.value = URL.createObjectURL(blob)
    if (isPdf.value) {
      const data = await blob.arrayBuffer()
      if (current !== generation) return
      loadingTask = getDocument({ data: new Uint8Array(data), isEvalSupported: false })
      const document = await loadingTask.promise
      if (current !== generation) return
      pdf = document
      pageCount.value = document.numPages
    }
    loading.value = false
    await nextTick()
    if (current === generation && pdf) await renderPage()
  } catch (err) {
    if (current === generation) {
      console.error('PDF preview failed:', err)
      loading.value = false
      error.value = err?.message?.includes('does not match')
        ? 'Обновите страницу, чтобы загрузить актуальную версию предпросмотра PDF'
        : 'Не удалось открыть файл'
    }
  }
}
async function renderPage() {
  if (!pdf || !stage.value || !canvas.value) return
  const document = pdf
  const current = ++renderGeneration
  const previousTask = renderTask
  previousTask?.cancel()
  rendering.value = true
  try {
    if (previousTask) await previousTask.promise.catch(() => {})
    if (current !== renderGeneration) return
    const page = await document.getPage(pageNumber.value)
    if (current !== renderGeneration || !canvas.value) return
    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.max(.1, Math.min((stage.value.clientWidth - 32) / viewport.width, (stage.value.clientHeight - 32) / viewport.height))
    const fitted = page.getViewport({ scale })
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const target = canvas.value
    target.width = Math.ceil(fitted.width * pixelRatio)
    target.height = Math.ceil(fitted.height * pixelRatio)
    target.style.width = `${fitted.width}px`
    target.style.height = `${fitted.height}px`
    renderTask = page.render({ canvas: target, canvasContext: target.getContext('2d'), viewport: fitted, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] })
    await renderTask.promise
  } catch (err) {
    if (current === renderGeneration && err?.name !== 'RenderingCancelledException') {
      console.error('PDF page rendering failed:', err)
      error.value = 'Не удалось отобразить страницу'
    }
  } finally { if (current === renderGeneration) rendering.value = false }
}
function jumpToPage(event) {
  const value = Number(event.target.value)
  if (Number.isInteger(value)) pageNumber.value = Math.max(1, Math.min(pageCount.value, value))
  event.target.value = pageNumber.value
}
function onKeydown(event) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return
  if (event.key === 'ArrowRight' && pageNumber.value < pageCount.value) { event.preventDefault(); pageNumber.value++ }
  if (event.key === 'ArrowLeft' && pageNumber.value > 1) { event.preventDefault(); pageNumber.value-- }
}
watch(() => currentFile.value?.id, loadFile)
watch(pageNumber, renderPage)
onMounted(() => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value.showModal()
  resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(renderPage)
  })
  resizeObserver.observe(stage.value)
  loadFile()
})
onBeforeUnmount(() => {
  generation++
  release()
  resizeObserver?.disconnect()
  cancelAnimationFrame(resizeFrame)
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
})
</script>

<style scoped>
.preview { position: fixed; inset: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: var(--padding-secondary); box-sizing: border-box; border: 0; color: var(--text); background: transparent; }
.preview::backdrop { background: #9c9c9c50; backdrop-filter: blur(3px); }
.preview[open] { display: flex; flex-direction: column; gap: var(--padding-secondary); }
.preview-header { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; padding: .5rem .75rem; background: color-mix(in srgb, var(--foreground) 90%, transparent); border-radius: var(--border-radius); }
h2 { flex: 1; min-width: 0; margin: 0; font-size: 1rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
h3 { font-size: .85rem; margin: 0 0 1rem; color: var(--muted-text); }
a { color: var(--accent); }
button, input { font: inherit; color: inherit; }
button { cursor: pointer; border: 1px solid var(--border-color); border-radius: var(--border-radius); background: var(--foreground); }
button:disabled { cursor: default; opacity: .4; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 2.8rem; height: 2.8rem; flex-shrink: 0; }
.preview-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: 11rem minmax(0, 1fr); gap: 1rem; }
.preview-layout.single-file { grid-template-columns: minmax(0, 1fr); }
.other-files { min-height: 0; overflow-y: auto; padding: .5rem; background: color-mix(in srgb, var(--foreground) 85%, transparent); border-radius: var(--border-radius); }
.file-choice { display: flex; flex-direction: column; align-items: center; width: 100%; gap: .6rem; padding: .75rem; margin-bottom: .75rem; }
.file-sheet { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .5rem; width: 4.5rem; height: 5.5rem; background: var(--muted-foreground); border: 1px solid var(--border-color); border-radius: .25rem; }
.file-sheet i { font-size: 1.8rem; }
.file-sheet small { font-size: .65rem; }
.file-name { max-width: 100%; overflow-wrap: anywhere; font-size: .8rem; }
.selected { border-color: var(--accent); background: var(--muted-accent); color: var(--accent); }
.document-area { display: flex; flex-direction: column; min-width: 0; min-height: 0; gap: .75rem; }
.document-stage { flex: 1; min-height: 0; position: relative; display: flex; align-items: center; justify-content: center; overflow: auto; padding: 1rem; box-sizing: border-box; background: transparent; border-radius: var(--border-radius); }
.pdf-page { flex-shrink: 0; box-shadow: 0 2px 14px #0002; background: white; }
.invisible { visibility: hidden; }
.image-page { display: block; max-width: 100%; max-height: 100%; object-fit: contain; }
.preview-state { padding: 1rem; background: var(--foreground); border-radius: var(--border-radius); text-align: center; color: var(--muted-text); }
.preview-state button { padding: .6rem 1rem; }
.render-state { position: absolute; padding: .75rem; background: var(--foreground); border-radius: var(--border-radius); color: var(--muted-text); }
.page-navigation { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .6rem; flex-shrink: 0; align-self: center; max-width: 100%; padding: .5rem; box-sizing: border-box; background: color-mix(in srgb, var(--foreground) 90%, transparent); border-radius: var(--border-radius); }
.page-list { display: flex; gap: .4rem; }
.page-choice { display: flex; flex-direction: column; align-items: center; gap: .25rem; padding: .5rem .7rem; font-size: .8rem; }
.page-jump { display: flex; align-items: center; gap: .4rem; font-size: .8rem; color: var(--muted-text); }
.page-jump input { width: 3.5rem; padding: .4rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); background: var(--foreground); }
@media (max-width: 650px) {
  .preview { padding: .5rem; }
  .preview-layout { grid-template-columns: 5.5rem minmax(0, 1fr); gap: .4rem; }
  .other-files { padding: 0; }
  .file-choice { padding: .4rem; }
  .file-sheet { width: 2.5rem; height: 3.5rem; }
  .file-sheet i { font-size: 1.2rem; }
  .document-stage { padding: .5rem; }
  .page-choice { padding: .4rem; }
  .page-list { gap: .2rem; }
}
</style>
