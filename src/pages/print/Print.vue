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
      <SelectUI label="Масштаб" :options="scaleOptions" v-model="scale" />

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

      <div v-else class="print-page__preview">
        <div
          v-for="(page, pageIndex) in pages"
          :key="pageIndex"
          class="print-page__paper-outer"
          :style="paperOuterStyle(pageIndex)"
        >
          <div
            class="print-page__paper"
            :style="paperFrameStyle"
            :ref="(el) => measurePaper(pageIndex, el)"
          >
            <div
              class="print-page__sheets"
              :class="{ 'print-page__sheets--together': printTogether }"
            >
              <div
                v-for="item in page"
                :key="item.id"
                class="print-page__sheet"
                :style="{ zoom: scale + '%' }"
                :ref="(el) => measureSheet(item, el)"
              >
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
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import SelectUI from '@/components/SelectUI.vue'
import ReceiptPaper from '@/components/Receipt/ReceiptView/ReceiptPaper.vue'
import { getReceiptById } from '@/services/receipt.api'
import { useNotificationStore } from '@/stores/notification'
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Универсальная страница печати (см. meta.layout: 'full' в router/index.js —
// без сайдбара/шапки, ничего прятать под @media print не нужно). Новый тип
// документа для печати — новая запись в реестре, остальная страница не
// меняется.
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

// ?ids=1,2,3 — сегодня печатаем всегда по одному чеку, но страница уже
// поддерживает несколько (нужно для будущей печати выбранных чеков списком)
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

// По умолчанию каждый чек на отдельном листе — обычный вид "один документ,
// одна страница". Несколько узких чеков на одном листе имеет смысл, когда
// печатают на обычной бумаге, а не на кассовой ленте.
const printTogether = ref(false)

const orientation = ref('portrait')
const orientationOptions = [
  { label: 'Портретная', value: 'portrait' },
  { label: 'Альбомная', value: 'landscape' },
]

const scale = ref(100)
const scaleOptions = [50, 75, 100, 125, 150].map((v) => ({
  label: `${v}%`,
  value: v,
}))

// Реальные высоты отрисованных чеков (px, при текущих compact/zoom) —
// нужны, чтобы точно посчитать, сколько чеков влезает на лист по высоте.
// Ширина у компактного чека фиксирована (см. .receipt-paper--compact,
// 220px), поэтому колонки по ширине считаются делением, а не измерением.
const sheetHeights = reactive(new Map())

function measureSheet(item, el) {
  if (el) sheetHeights.set(item.id, el.offsetHeight)
}

const SHEET_WIDTH = 220 // px, .receipt-paper--compact при масштабе 100%
const SHEET_GAP = 8 // px, отступы вокруг .print-page__sheet при масштабе 100%

// Раскладка по "страницам" превью: каждая — один .print-page__paper.
// Раздельно — своя страница на чек (уже точно, без измерений — один чек
// всегда один лист). На одном листе — реальная упаковка по измеренным
// высотам: колонки считаем делением ширины листа, а перенос на новую
// страницу — как только накопленная высота строк превышает высоту листа
// (то же самое правило, что break-inside: avoid у настоящей печати).
const pages = computed(() => {
  if (!printTogether.value) {
    return items.value.map((item) => [item])
  }

  // zoom реально меняет физический размер чека — при уменьшении масштаба
  // должно помещаться больше в ряд/на лист, а не столько же, но мельче
  const zoomFactor = scale.value / 100
  const sheetWidth = SHEET_WIDTH * zoomFactor
  const sheetGap = SHEET_GAP * zoomFactor

  const { width: pageWidth, height: pageHeight } = previewPage.value
  const columns = Math.max(1, Math.floor(pageWidth / (sheetWidth + sheetGap)))

  const result = []
  let currentPage = []
  let column = 0
  let rowHeight = 0
  let pageHeightUsed = 0

  for (const item of items.value) {
    // Пока чек ещё не отрисован и не измерен (первый рендер) — считаем
    // высоту нулевой: всё временно попадёт на один лист, а как только
    // measureSheet отработает, pages пересчитается по реальным высотам.
    // offsetHeight уже учитывает zoom сам по себе — досчитывать не нужно.
    const height = (sheetHeights.get(item.id) ?? 0) + sheetGap

    if (column >= columns) {
      pageHeightUsed += rowHeight
      rowHeight = 0
      column = 0

      if (pageHeight && currentPage.length && pageHeightUsed + height > pageHeight) {
        result.push(currentPage)
        currentPage = []
        pageHeightUsed = 0
      }
    }

    currentPage.push(item)
    rowHeight = Math.max(rowHeight, height)
    column++
  }

  if (currentPage.length) result.push(currentPage)
  return result
})

// Точный размер листа A4 для превью (в CSS-пикселях, 1in = 96px — тот же
// расчёт, которым сам браузер переводит мм в px при вёрстке)
const MM_TO_PX = 96 / 25.4
const A4_MM = { width: 210, height: 297 }

const previewPage = computed(() => {
  const [width, height] =
    orientation.value === 'landscape'
      ? [A4_MM.height, A4_MM.width]
      : [A4_MM.width, A4_MM.height]
  return { width: width * MM_TO_PX, height: height * MM_TO_PX }
})

// Вписываем превью в разумную ширину экрана — реальный print этого не
// видит: transform: scale() применяется только в @media screen ниже
const PREVIEW_MAX_WIDTH = 640

const previewFitScale = computed(() =>
  Math.min(1, PREVIEW_MAX_WIDTH / previewPage.value.width)
)

const paperFrameStyle = computed(() => ({
  width: `${previewPage.value.width}px`,
  minHeight: `${previewPage.value.height}px`,
  '--preview-fit-scale': previewFitScale.value,
}))

// Реальные (неискажённые transform-ом) высоты каждой страницы превью —
// offsetHeight не учитывает transform: scale(), поэтому даёт ту же высоту,
// что была бы у .print-page__paper без масштабирования. В альбомной
// ориентации высота листа сама по себе маленькая (210мм), и контент чека
// легко превышает её — если тогда считать высоту обёртки по номиналу
// (297мм), лист не помещается в свою обёртку и наезжает на следующий.
const pageHeights = reactive(new Map())

function measurePaper(pageIndex, el) {
  if (el) pageHeights.set(pageIndex, el.offsetHeight)
}

// Внешняя обёртка — уже нужного (уменьшенного) размера, чтобы вписанный по
// PREVIEW_MAX_WIDTH лист резервировал в раскладке ровно столько места,
// сколько занимает визуально, а не полный физический размер (иначе вокруг
// уменьшенных листов оставалась пустая невидимая область их исходного
// размера — листы выглядели маленькими и далеко друг от друга)
function paperOuterStyle(pageIndex) {
  const fit = previewFitScale.value
  const height = pageHeights.get(pageIndex) ?? previewPage.value.height
  return {
    width: `${previewPage.value.width * fit}px`,
    height: `${height * fit}px`,
  }
}

// @page нельзя надёжно задать из <style scoped> компонента (см. историю
// правок ReceiptPaper.vue) — управляем настоящим <style> в <head> напрямую.
let pageStyleEl = null

function applyPageStyle() {
  if (!pageStyleEl) {
    pageStyleEl = document.createElement('style')
    pageStyleEl.id = 'print-page-size-style'
    document.head.appendChild(pageStyleEl)
  }
  pageStyleEl.textContent = `@page { size: A4 ${orientation.value}; margin: 0; }`
}

watch(orientation, applyPageStyle, { immediate: true })

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
  // Открыта через window.open — закроется сама; если открыта напрямую по
  // ссылке (window.close() браузер тихо проигнорирует), просто уводим
  // куда-то осмысленное.
  window.close()
  router.push({ name: 'receipts' })
}

onMounted(async () => {
  await load()
  if (!items.value.length) return

  // Автозапуск — только для одного документа (прежнее поведение кнопки
  // "Печать" на странице чека). При нескольких сначала даём выбрать
  // "раздельно/на одном листе" — печатаем только по клику на кнопку.
  if (items.value.length > 1) return

  // Печатаемый контент (например, QR-коды в ReceiptPaper) рендерится
  // асинхронно — ждём кадр отрисовки перед автозапуском печати. Кнопка
  // "Печать" выше остаётся на случай, если браузер заблокирует авто-print
  // или нужно распечатать повторно.
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

.print-page__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--padding-primary);
}

.print-page__paper-outer {
  flex-shrink: 0;
}

.print-page__paper {
  background: #fff;
  border: 0.07rem solid var(--border-color);
  box-shadow: 0 0.29rem 1.14rem rgba(0, 0, 0, 0.08);
  padding: var(--padding-secondary);
  box-sizing: border-box;
  /* pages уже точно рассчитан по измеренным высотам (см. скрипт), лист
     не должен переполняться — overflow:visible только на случай одного
     чека выше целого листа (сам по себе, реальная печать тоже не смогла
     бы разбить его иначе) */
  overflow: visible;
}

@media screen {
  .print-page__paper {
    /* top left — совпадает с тем, как посчитан размер обёртки
       (paperOuterStyle): ужатый лист резервирует ровно свой видимый
       размер, без пустого места вокруг */
    transform: scale(var(--preview-fit-scale, 1));
    transform-origin: top left;
  }
}

.print-page__sheets {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--padding-primary);
}

.print-page__sheet {
  /* не резать чек по границе страницы — если целиком не влезает в
     остаток листа, переносится целиком, а не обрывается посередине */
  break-inside: avoid;
  page-break-inside: avoid;
}

/* "Все на одном листе" — flex-wrap для этого плохо годится: если ряд
   целиком не помещается в остаток страницы, браузеры режут его посередине
   вместо переноса (именно так чек и обрезался). inline-block вместо flex —
   элементы текут и переносятся как слова в тексте, у каждого свой
   break-inside, и лишний просто уходит на следующий лист целиком. */
.print-page__sheets--together {
  display: block;
  text-align: center;
}

.print-page__sheets--together .print-page__sheet {
  display: inline-block;
  vertical-align: top;
  text-align: left;
  margin: 0 0.25rem 0.5rem;
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

  .print-page__preview {
    gap: 0;
  }

  /* Рамка листа — только для превью на экране; реальный размер страницы
     задаёт @page (см. applyPageStyle), а не эта коробка */
  .print-page__paper-outer {
    width: auto !important;
    height: auto !important;
  }

  .print-page__paper {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0;
    width: auto !important;
    min-height: auto !important;
  }

  .print-page__sheets {
    gap: 0;
  }

  /* Каждая "страница" превью — с новой страницы печати, кроме самой
     первой. В режиме "на одном листе" таких страниц и так одна. */
  .print-page__paper-outer + .print-page__paper-outer {
    break-before: page;
    page-break-before: always;
  }
}
</style>
