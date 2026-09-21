<template>
  <div class="print-page">
    <div class="print-page__topbar">
      <span class="print-page__title">
        <i class="fa-regular fa-print"></i>
        Печать
      </span>

      <div class="print-page__actions">
        <ButtonUI
          type="accent"
          icon="fa-regular fa-print"
          :disabled="isLoading || !items.length"
          @click="onPrint"
        >
          Печать
        </ButtonUI>
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-xmark"
          v-tooltip="'Закрыть'"
          @click="onClose"
        />
      </div>
    </div>

    <div v-if="items.length" class="print-page__settings">
      <SelectUI
        label="Ориентация"
        :options="orientationOptions"
        v-model="orientation"
      />
      <SelectUI
        label="Масштаб (предпросмотр)"
        :options="scaleOptions"
        v-model="scale"
      />

      <SelectUI
        label="Расположение"
        :options="alignOptions"
        v-model="horizontalAlign"
      />

      <div class="print-page__slider">
        <label>Ширина чека: {{ receiptWidthMm }} мм</label>
        <input
          type="range"
          min="65"
          max="105"
          step="1"
          v-model.number="receiptWidthMm"
        />
      </div>

      <div class="print-page__slider">
        <label>Шрифт чека: {{ receiptFontPt }} пт</label>
        <input
          type="range"
          min="5"
          max="14"
          step="0.5"
          v-model.number="receiptFontPt"
        />
      </div>

      <div class="print-page__slider">
        <label>Поля листа A4: {{ pageMarginMm }} мм</label>
        <input
          type="range"
          min="0"
          max="25"
          step="1"
          v-model.number="pageMarginMm"
        />
      </div>

      <div class="print-page__slider">
        <label>Зазор между чеками: {{ receiptGapMm }} мм</label>
        <input
          type="range"
          min="0"
          max="15"
          step="1"
          v-model.number="receiptGapMm"
        />
      </div>

      <div class="print-page__slider">
        <label>Масштаб чека: {{ receiptScale }}%</label>
        <input
          type="range"
          min="30"
          max="200"
          step="5"
          v-model.number="receiptScale"
        />
      </div>

      <label class="print-page__layout-toggle">
        <input type="checkbox" v-model="cutLines" />
        Линии отреза
      </label>

      <label v-if="items.length > 1" class="print-page__layout-toggle">
        <input type="checkbox" v-model="printTogether" />
        Все на одном листе
      </label>
    </div>

    <div class="print-page__body">
      <div v-if="isLoading" class="print-page__state">
        <LoaderTitle />
      </div>

      <div v-else-if="!registryEntry" class="print-page__state">
        <i class="fa-regular fa-triangle-exclamation"></i>
        <span>Неизвестный тип документа для печати</span>
      </div>

      <div v-else-if="!items.length" class="print-page__state">
        <i class="fa-regular fa-print"></i>
        <span>Нечего печатать</span>
      </div>

      <!-- Разбивку на страницы при печати решает браузер (@page + break-inside/break-before ниже), задаём только ширину -->
      <div class="print-page__canvas-outer" :style="canvasOuterStyle">
        <div class="print-page__canvas" :style="canvasStyle">
          <div
            class="print-page__sheets"
            :class="{
              'print-page__sheets--together': printTogether,
              'print-page__sheets--cut': cutLines,
            }"
            :style="sheetsAlignStyle"
          >
            <div v-for="item in items" :key="item.id" class="print-page__sheet">
              <component
                :is="registryEntry.component"
                v-bind="registryEntry.mapProps(item)"
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import SelectUI from '@/components/SelectUI.vue'
import ReceiptPaper from '@/components/Receipt/ReceiptView/ReceiptPaper.vue'
import { getReceiptById } from '@/services/receipt.api'
import { useNotificationStore } from '@/stores/notification'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Универсальная страница печати — новый тип документа = новая запись в реестре
const PRINT_REGISTRY = {
  receipt: {
    fetch: getReceiptById,
    component: ReceiptPaper,
    mapProps: (item) => ({ receipt: item }),
  },
}

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

const registryEntry = computed(() => PRINT_REGISTRY[route.params.type])

// ?ids=1,2,3 — задел под печать нескольких чеков списком
const ids = computed(() => {
  const raw = route.query.ids
  if (!raw) return []
  return String(raw)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
})

const items = ref([])
const isLoading = ref(false)

// По умолчанию каждый чек на отдельном листе
const printTogether = ref(false)

const orientation = ref('portrait')
const orientationOptions = [
  { label: 'Портретная', value: 'portrait' },
  { label: 'Альбомная', value: 'landscape' },
]

// Масштаб предпросмотра — декоративный, на печать не влияет
const scale = ref(100)
const scaleOptions = [50, 75, 100, 125, 150].map((v) => ({
  label: `${v}%`,
  value: v,
}))

// --- Настройки раскладки на листе (сохраняются в localStorage) ---
const LAYOUT_STORAGE_KEY = 'receipt-print-layout-settings'

const receiptWidthMm = ref(72) // 45–105
const receiptFontPt = ref(11) // 8–15
const pageMarginMm = ref(10) // 0–25
const receiptGapMm = ref(4) // 0–15
const cutLines = ref(true)
// В отличие от "Масштаб (предпросмотр)" — этот реально печатается
const receiptScale = ref(100) // 50–200

const horizontalAlign = ref('left') // 'left' | 'center' | 'right'
const alignOptions = [
  { label: 'Слева', value: 'left' },
  { label: 'По центру', value: 'center' },
  { label: 'Справа', value: 'right' },
]

// align-items для flex-режима, text-align для inline-block ("на одном листе")
const ALIGN_ITEMS_MAP = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

const sheetsAlignStyle = computed(() => ({
  alignItems: ALIGN_ITEMS_MAP[horizontalAlign.value],
  textAlign: horizontalAlign.value,
}))

function loadLayoutSettings() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (typeof saved.receiptWidthMm === 'number')
      receiptWidthMm.value = saved.receiptWidthMm
    if (typeof saved.receiptFontPt === 'number')
      receiptFontPt.value = saved.receiptFontPt
    if (typeof saved.pageMarginMm === 'number')
      pageMarginMm.value = saved.pageMarginMm
    if (typeof saved.receiptGapMm === 'number')
      receiptGapMm.value = saved.receiptGapMm
    if (typeof saved.receiptScale === 'number')
      receiptScale.value = saved.receiptScale
    if (typeof saved.cutLines === 'boolean') cutLines.value = saved.cutLines
    if (typeof saved.horizontalAlign === 'string')
      horizontalAlign.value = saved.horizontalAlign
  } catch {
    // localStorage недоступен — остаёмся на значениях по умолчанию
  }
}

function saveLayoutSettings() {
  try {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({
        receiptWidthMm: receiptWidthMm.value,
        receiptFontPt: receiptFontPt.value,
        pageMarginMm: pageMarginMm.value,
        receiptGapMm: receiptGapMm.value,
        receiptScale: receiptScale.value,
        cutLines: cutLines.value,
        horizontalAlign: horizontalAlign.value,
      })
    )
  } catch {
    // некритично — просто не переживёт перезагрузку
  }
}

loadLayoutSettings()

watch(
  [
    receiptWidthMm,
    receiptFontPt,
    pageMarginMm,
    receiptGapMm,
    receiptScale,
    cutLines,
    horizontalAlign,
  ],
  saveLayoutSettings
)

// Ширина листа A4 в px (1in = 96px); высота не нужна — холст растёт свободно
const MM_TO_PX = 96 / 25.4
const A4_MM = { width: 210, height: 297 }

const pageWidthPx = computed(
  () =>
    (orientation.value === 'landscape' ? A4_MM.height : A4_MM.width) * MM_TO_PX
)

const previewFitScale = computed(() => scale.value / 100)

const canvasStyle = computed(() => ({
  width: `${pageWidthPx.value}px`,
  // padding для превью на экране, при печати поля даёт @page (см. applyPageStyle)
  padding: `${pageMarginMm.value}mm`,
  '--receipt-w-mm': `${receiptWidthMm.value}mm`,
  '--receipt-fs': `${receiptFontPt.value}pt`,
  '--receipt-gap-mm': `${receiptGapMm.value}mm`,
  '--receipt-scale': receiptScale.value / 100,
  '--preview-fit-scale': previewFitScale.value,
}))

// Резервируем уже смасштабированную ширину — иначе вокруг холста остаётся пустое место его исходного размера
const canvasOuterStyle = computed(() => ({
  width: `${pageWidthPx.value * previewFitScale.value}px`,
}))

// @page нельзя надёжно задать из <style scoped> — управляем <style> в <head> напрямую
let pageStyleEl = null

function applyPageStyle() {
  if (!pageStyleEl) {
    pageStyleEl = document.createElement('style')
    pageStyleEl.id = 'print-page-size-style'
    document.head.appendChild(pageStyleEl)
  }
  // margin — не 0: @page применяется на каждом листе отдельно, в отличие от padding. В диалоге печати нужны поля "Обычные", не "Без полей"
  pageStyleEl.textContent = `@page { size: A4 ${orientation.value}; margin: ${pageMarginMm.value}mm; }`
}

watch([orientation, pageMarginMm], applyPageStyle, { immediate: true })

onUnmounted(() => {
  pageStyleEl?.remove()
})

async function load() {
  const entry = registryEntry.value
  if (!entry || !ids.value.length) {
    items.value = []
    return
  }

  isLoading.value = true
  try {
    const results = await Promise.all(
      ids.value.map((id) => entry.fetch(id).catch(() => null))
    )
    items.value = results.filter(Boolean)

    if (!items.value.length) {
      notificationStore.addNotification(
        'Не удалось загрузить документы для печати',
        'error'
      )
    }
  } finally {
    isLoading.value = false
  }
}

function onPrint() {
  window.print()
}

function onClose() {
  // window.close() сработает только если открыта через window.open
  window.close()
  router.push({ name: 'receipts' })
}

onMounted(async () => {
  await load()
  if (!items.value.length) return

  // Автозапуск — только для одного документа, при нескольких сначала настраивают раскладку
  if (items.value.length > 1) return

  // ждём кадр отрисовки (QR рендерится асинхронно) перед автозапуском печати
  await nextTick()
  setTimeout(() => window.print(), 300)
})
</script>

<style scoped>
.print-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--background);
}

.print-page__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-primary);
  padding: 0.71rem var(--padding-primary);
  background: var(--foreground);
  border-bottom: 0.07rem solid var(--border-color);
  flex-shrink: 0;
}

.print-page__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text);
}

.print-page__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.print-page__layout-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.86rem;
  color: var(--muted-text);
  cursor: pointer;
  user-select: none;
}

.print-page__layout-toggle input {
  cursor: pointer;
}

.print-page__settings {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: var(--padding-primary);
  padding: 0.71rem var(--padding-primary);
  background: var(--foreground);
  border-bottom: 0.07rem solid var(--border-color);
  flex-shrink: 0;
}

.print-page__settings .print-page__layout-toggle {
  padding-bottom: 0.86rem;
}

.print-page__slider {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  min-width: 11rem;
}

.print-page__slider label {
  font-size: 0.8rem;
  color: var(--muted-text);
  font-weight: 600;
  white-space: nowrap;
}

.print-page__slider input[type='range'] {
  width: 100%;
  cursor: pointer;
  accent-color: var(--accent);
}

.print-page__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--padding-primary);
}

.print-page__state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--muted-text);
}

.print-page__state i {
  font-size: 2rem;
}

.print-page__canvas-outer {
  margin: 0 auto;
}

.print-page__canvas {
  background: #fff;
  border: 0.07rem solid var(--border-color);
  box-shadow: 0 0.29rem 1.14rem rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

@media screen {
  .print-page__canvas {
    transform: scale(var(--preview-fit-scale, 1));
    transform-origin: top left;
  }
}

.print-page__sheets {
  display: flex;
  flex-direction: column;
  /* НЕ center — иначе отступ центрирования маскирует поле страницы */
  align-items: flex-start;
  gap: var(--receipt-gap-mm, 4mm);
}

.print-page__sheet {
  /* не резать чек по границе страницы */
  break-inside: avoid;
  page-break-inside: avoid;
}

/* "Раздельно" — каждый чек с новой страницы, кроме первого */
.print-page__sheets:not(.print-page__sheets--together)
  .print-page__sheet
  + .print-page__sheet {
  break-before: page;
  page-break-before: always;
}

/* inline-block вместо flex-wrap — иначе ряд может обрезаться разрывом страницы */
.print-page__sheets--together {
  display: block;
  /* гасит внешние половинки зазора на чеках ниже, чтобы поле было только между ними */
  margin: 0 calc(var(--receipt-gap-mm, 4mm) / -2);
}

.print-page__sheets--together .print-page__sheet {
  display: inline-block;
  vertical-align: top;
  margin: 0 calc(var(--receipt-gap-mm, 4mm) / 2) var(--receipt-gap-mm, 4mm);
}

.print-page__sheets--cut .print-page__sheet {
  border: 1px dashed #000;
}

@media print {
  .print-page {
    height: auto;
    background: none;
  }

  .print-page__topbar,
  .print-page__settings {
    display: none;
  }

  .print-page__body {
    overflow: visible;
    padding: 0;
  }

  /* реальный размер и поля страницы задаёт @page, не этот холст */
  .print-page__canvas-outer {
    width: auto !important;
    margin: 0;
  }

  .print-page__canvas {
    background: none;
    border: none;
    box-shadow: none;
    width: auto !important;
    padding: 0 !important;
  }
}
</style>
