<template>
  <!-- ================== Сканирование QR ================== -->
  <div class="scan-actions">
    <ButtonUI
      type="muted"
      icon="fa-regular fa-image"
      :disabled="isScanningImage || isCheckingReceipt || cameraOpen || manualMode"
      @click="qrFileInput.click()"
    >
      Сканировать по фото
    </ButtonUI>

    <ButtonUI
      type="muted"
      icon="fa-regular fa-camera"
      :disabled="isScanningImage || isCheckingReceipt || cameraOpen || manualMode"
      @click="openCameraScanner"
    >
      Сканировать камерой
    </ButtonUI>

    <ButtonUI
      type="muted"
      icon="fa-regular fa-keyboard"
      :disabled="isScanningImage || isCheckingReceipt || cameraOpen || manualMode"
      @click="manualMode = true"
    >
      Ввести вручную
    </ButtonUI>

    <!-- Без capture — иначе на большинстве мобильных браузеров пикер
         пропускает галерею и сразу открывает камеру (для живой съёмки уже
         есть отдельная кнопка выше), а тут нужен выбор существующих фото,
         в том числе нескольких сразу. -->
    <input
      ref="qrFileInput"
      type="file"
      accept="image/*"
      multiple
      style="display: none"
      @change="onQrFileSelected"
    />
  </div>

  <!-- ================== Камера ================== -->
  <!-- Не внутри .scan-page — это полноэкранный fixed-оверлей, ему видимость
       карточки ниже не нужна. -->
  <div v-if="cameraOpen" class="qr-camera">
    <div class="qr-camera__back" @click="closeCameraScanner"></div>

    <div class="qr-camera__container">
      <div class="qr-camera__header">
        <span>
          {{
            isCheckingReceipt
              ? 'Получаем данные чека...'
              : 'Наведите камеру на QR-код чека'
          }}
        </span>

        <i
          class="fa-regular fa-xmark qr-camera__close"
          @click="closeCameraScanner"
        ></i>
      </div>

      <video ref="qrVideo" class="qr-camera__video" playsinline></video>

      <div v-if="isCheckingReceipt" class="qr-camera__loading">
        <i class="fa-regular fa-spinner fa-spin"></i>
        Проверяем чек...
      </div>

      <div v-if="cameraError" class="qr-camera__error">
        {{ cameraError }}
      </div>
    </div>
  </div>

  <!-- Карточка ниже нужна, только когда есть что показать — статус
       сканирования, форма ручного ввода или уже распознанные чеки. -->
  <div v-if="hasScanContent" class="scan-page">
    <!-- Пустой .scan-block всё равно занимает gap .scan-page между собой и
         следующей секцией — рендерим, только когда внутри реально есть что
         показать. -->
    <div
      v-if="
        isScanningImage ||
        isCheckingReceipt ||
        scannedPhotoUrl ||
        scanBatchErrors.length ||
        scanLimitNotice
      "
      class="scan-block"
    >
      <div v-if="isScanningImage" class="scan-block__status">
        <i class="fa-regular fa-spinner fa-spin"></i>
        <span v-if="scanBatch.total > 1">
          Получаем данные чека {{ scanBatch.current }} из
          {{ scanBatch.total }}...
        </span>
        <span v-else>Получаем данные чека...</span>
      </div>

      <div v-if="isCheckingReceipt" class="scan-block__status">
        <i class="fa-regular fa-spinner fa-spin"></i>
        Получаем данные чека...
      </div>

      <!-- Фото пока идёт распознавание — прикрепить/не прикрепить решаем
           уже в карточке результата ниже (item.attachPhoto), тут только
           возможность передумать и убрать фото ДО получения ответа. -->
      <div v-if="scannedPhotoUrl" class="scan-block__photo">
        <img :src="scannedPhotoUrl" alt="Скан чека" />

        <div class="scan-block__photo-info">
          <span class="scan-block__photo-label">Фото прикреплено к чеку</span>

          <button
            type="button"
            class="scan-block__photo-remove"
            @click="clearScannedPhoto"
            v-tooltip="'Убрать фото'"
          >
            <i class="fa-regular fa-xmark"></i>
          </button>
        </div>
      </div>

      <div v-if="scanLimitNotice" class="scan-block__notice">
        {{ scanLimitNotice }}
      </div>

      <div v-if="scanBatchErrors.length" class="scan-block__batch-errors">
        <div
          v-for="err in scanBatchErrors"
          :key="err.id"
          class="scan-block__batch-error"
        >
          <button
            v-if="err.url"
            type="button"
            class="scan-block__batch-error-thumb"
            @click="filePreviewStore.open({ url: err.url, originalName: err.file.name, mimeType: err.file.type })"
            v-tooltip="'Посмотреть фото'"
          >
            <img :src="err.url" :alt="err.file.name" />
          </button>

          <div class="scan-block__batch-error-text">
            <span class="scan-block__batch-error-name">{{ err.fileName }}</span>
            <span class="scan-block__batch-error-message">{{ err.message }}</span>
          </div>

          <button
            type="button"
            class="scan-block__photo-remove"
            @click="dismissBatchError(err)"
            v-tooltip="'Убрать'"
          >
            <i class="fa-regular fa-xmark"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- ================== Ввод реквизитов вручную ================== -->
    <div v-if="manualMode" class="manual-form">
      <p class="manual-form__hint">
        Реквизиты обычно печатаются внизу самого чека — сервис найдёт чек по
        ним так же, как по QR-коду.
      </p>

      <div class="manual-form__grid">
        <InputUi
          v-model="manualFields.fn"
          label="ФН"
          placeholder="9280440300770583"
          :disabled="isCheckingReceipt"
          required
        />
        <InputUi
          v-model="manualFields.fd"
          label="ФД"
          placeholder="33110"
          :disabled="isCheckingReceipt"
          required
        />
        <InputUi
          v-model="manualFields.fp"
          label="ФП"
          placeholder="4138469556"
          :disabled="isCheckingReceipt"
          required
        />
        <InputUi
          v-model="manualFields.datetime"
          type="datetime-local"
          label="Дата и время чека"
          :disabled="isCheckingReceipt"
          required
        />
        <InputUi
          v-model="manualFields.amount"
          type="number"
          label="Сумма чека, ₽"
          placeholder="419.54"
          :disabled="isCheckingReceipt"
          required
        />
      </div>

      <div v-if="manualError" class="manual-form__error">
        {{ manualError }}
      </div>

      <div class="manual-form__actions">
        <ButtonUI
          type="muted"
          :disabled="isCheckingReceipt"
          @click="cancelManual"
        >
          Отмена
        </ButtonUI>

        <ButtonUI
          type="accent"
          :disabled="isCheckingReceipt"
          @click="submitManual"
        >
          <i v-if="isCheckingReceipt" class="fa-regular fa-spinner fa-spin"></i>
          Проверить чек
        </ButtonUI>
      </div>
    </div>

    <!-- ================== Очередь распознанных чеков ================== -->
    <!-- Каждый чек сюда мог попасть любым из трёх способов выше — фото,
         камера или реквизиты вручную — и добавляются они независимо: можно
         сохранить по одному сразу, можно накопить несколько и разом. -->
    <div v-if="pendingReceipts.length > 0" class="pending-bulk">
      <div class="pending-bulk__info">
        <span class="pending-bulk__count">
          Чеков в очереди: {{ pendingReceipts.length }}
        </span>
        <span class="pending-bulk__total">
          Итого: <b>{{ formatMoney(pendingTotal) }}</b>
        </span>
      </div>

      <ButtonUI
        v-if="pendingReceipts.length > 1"
        type="accent"
        :disabled="isAddingAll"
        @click="addAllPending"
      >
        <i v-if="isAddingAll" class="fa-regular fa-spinner fa-spin"></i>
        Добавить все
      </ButtonUI>
    </div>

    <div
      v-for="item in pendingReceipts"
      :key="item.id"
      class="receipt-result"
    >
      <div class="receipt-result__header">
        <h3>Данные чека</h3>

        <button
          type="button"
          class="receipt-result__clear"
          @click="removePending(item)"
          v-tooltip="'Убрать из списка'"
        >
          <i class="fa-regular fa-xmark"></i>
        </button>
      </div>

      <div class="receipt-result__summary">
        <div v-if="getSummary(item).place" class="receipt-result__row">
          <span class="receipt-result__label">Место расчётов</span>
          <span>{{ getSummary(item).place }}</span>
        </div>

        <div v-if="getSummary(item).address" class="receipt-result__row">
          <span class="receipt-result__label">Адрес</span>
          <span>{{ getSummary(item).address }}</span>
        </div>

        <div v-if="getSummary(item).date" class="receipt-result__row">
          <span class="receipt-result__label">Дата и время</span>
          <span>{{ formatDate(getSummary(item).date) }}</span>
        </div>

        <div v-if="getSummary(item).operator" class="receipt-result__row">
          <span class="receipt-result__label">Кассир</span>
          <span>{{ getSummary(item).operator }}</span>
        </div>

        <div
          v-if="getSummary(item).fiscalDocumentNumber"
          class="receipt-result__row"
        >
          <span class="receipt-result__label">ФД</span>
          <span>{{ getSummary(item).fiscalDocumentNumber }}</span>
        </div>

        <div v-if="getSummary(item).fiscalSign" class="receipt-result__row">
          <span class="receipt-result__label">ФПД</span>
          <span>{{ getSummary(item).fiscalSign }}</span>
        </div>
      </div>

      <button
        v-if="getSummary(item).items.length"
        type="button"
        class="receipt-result__items-toggle"
        :class="{ 'receipt-result__items-toggle--open': item.itemsVisible }"
        @click="item.itemsVisible = !item.itemsVisible"
      >
        <i
          class="fa-regular fa-chevron-right"
          :class="{ 'receipt-result__items-chevron--open': item.itemsVisible }"
        ></i>
        Позиции чека ({{ getSummary(item).items.length }})
      </button>

      <div
        v-if="item.itemsVisible && getSummary(item).items.length"
        class="receipt-result__items-wrap"
      >
        <table class="receipt-result__items">
          <thead>
            <tr>
              <th>#</th>
              <th>Наименование</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in getSummary(item).items"
              :key="index"
            >
              <td>{{ index + 1 }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.quantity }}</td>
              <td>{{ formatMoney(row.price) }}</td>
              <td>{{ formatMoney(row.sum) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="receipt-result__total">
        <span>Итого</span>
        <span>{{ formatMoney(getSummary(item).totalSum) }}</span>
      </div>

      <div v-if="item.photoUrl" class="scan-block__photo">
        <img :src="item.photoUrl" alt="Скан чека" />

        <div class="scan-block__photo-info">
          <label class="checkbox-label">
            <input type="checkbox" v-model="item.attachPhoto" />
            <span>Прикрепить это фото к чеку</span>
          </label>

          <button
            type="button"
            class="scan-block__photo-remove"
            @click="openAttachPhoto(item)"
            v-tooltip="'Заменить фото'"
          >
            <i class="fa-regular fa-arrows-rotate"></i>
          </button>
        </div>
      </div>

      <button
        v-else
        type="button"
        class="pending-attach-photo"
        @click="openAttachPhoto(item)"
      >
        <i class="fa-regular fa-image"></i>
        Прикрепить фото к чеку
      </button>

      <div class="receipt-result__footer">
        <div v-if="item.addError" class="receipt-result__error">
          {{ item.addError }}
        </div>

        <div class="receipt-result__actions">
          <ButtonUI
            type="muted"
            :disabled="item.isAdding"
            @click="removePending(item)"
          >
            Убрать
          </ButtonUI>

          <ButtonUI
            type="accent"
            :disabled="item.isAdding"
            @click="addOnePending(item)"
          >
            <i v-if="item.isAdding" class="fa-regular fa-spinner fa-spin"></i>
            Добавить
          </ButtonUI>
        </div>
      </div>
    </div>

    <!-- Общий скрытый input для "Прикрепить/заменить фото" у любого элемента
         очереди — какой именно, определяет attachPhotoTarget. -->
    <input
      ref="itemPhotoInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onItemPhotoSelected"
    />
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'

import QrScanner from 'qr-scanner'
import QrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url'

import { nextTick, ref, reactive, computed, onBeforeUnmount } from 'vue'

import {
  checkReceiptByRaw,
  checkReceiptByImage,
  checkReceiptByRequisites,
  ReceiptCheckError,
} from '@/services/proverkacheka.api'
import { uploadReceiptFile } from '@/services/receipt.api'
import {
  mapExternalReceipt,
  parseExternalDate,
} from '@/utils/receiptCheck.utils'
import { playSuccessSound } from '@/utils/sound.utils'

import { useConfirmModal } from '@/stores/confirmModal'
import { useFilePreviewStore } from '@/stores/filePreview'
import { useReceiptStore } from '@/stores/receipt'
import { useUserStore } from '@/stores/user'

QrScanner.WORKER_PATH = QrScannerWorkerPath

const receiptStore = useReceiptStore()
const userStore = useUserStore()
const filePreviewStore = useFilePreviewStore()
const confirmModalStore = useConfirmModal()

const qrFileInput = ref(null)
const qrVideo = ref(null)

let cameraScanner = null

const isScanningImage = ref(false)
const cameraOpen = ref(false)
const cameraError = ref('')

// Превью фото, пока идёт распознавание конкретно ЭТОГО скана — как только
// чек разобран, файл переезжает в свой pending-элемент очереди (см.
// addPending), а эти refs очищаются под следующий скан.
const scannedPhotoFile = ref(null)
const scannedPhotoUrl = ref('')

const isCheckingReceipt = ref(false)

// Очередь распознанных, но ещё не сохранённых чеков. Пополняется любым из
// трёх способов (фото/камера/вручную) сколько угодно раз подряд — каждый
// со своей карточкой результата, своим фото (если есть) и своей ошибкой
// сохранения, независимо от остальных элементов очереди.
const pendingReceipts = ref([])

function addPending(data, extra = {}) {
  // Единая точка успеха для всех трёх способов (фото/камера/вручную) —
  // отсюда звук, а не по отдельности на каждый вызов.
  playSuccessSound()

  const item = {
    id: crypto.randomUUID(),
    data,
    rawQr: extra.raw ?? null,
    photoFile: extra.photoFile ?? null,
    photoUrl: extra.photoFile ? URL.createObjectURL(extra.photoFile) : '',
    attachPhoto: true,
    itemsVisible: false,
    isAdding: false,
    addError: '',
  }
  pendingReceipts.value.push(item)
  // Возвращаем ссылку из самого реактивного массива, а не "сырой" item —
  // иначе openAttachPhoto(item, ...) держит объект ДО того, как Vue обернул
  // его в reactive-прокси при пуше, и последующие item.photoFile = ...
  // в onItemPhotoSelected идут мимо прокси: Vue не видит изменение и не
  // перерисовывает карточку (превью/чекбокс так и не появляются).
  return pendingReceipts.value[pendingReceipts.value.length - 1]
}

function removePending(item) {
  if (item.photoUrl) URL.revokeObjectURL(item.photoUrl)
  pendingReceipts.value = pendingReceipts.value.filter((r) => r.id !== item.id)
}

// Прикрепить/заменить фото прямо в очереди — не важно, каким способом чек
// туда попал (даже если камерой и снимок кадра не удался, или вручную).
const itemPhotoInput = ref(null)
let attachPhotoTarget = null

function openAttachPhoto(item, { camera = false } = {}) {
  attachPhotoTarget = item
  if (itemPhotoInput.value) {
    if (camera) itemPhotoInput.value.setAttribute('capture', 'environment')
    else itemPhotoInput.value.removeAttribute('capture')
  }
  itemPhotoInput.value?.click()
}

function onItemPhotoSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = ''

  const item = attachPhotoTarget
  attachPhotoTarget = null
  if (!file || !item) return

  if (item.photoUrl) URL.revokeObjectURL(item.photoUrl)
  item.photoFile = file
  item.photoUrl = URL.createObjectURL(file)
  item.attachPhoto = true
}

// Ручной ввод реквизитов (без QR) — см. checkReceiptByRequisites.
const manualMode = ref(false)
const manualError = ref('')

// Ручной ввод — только для обычных покупок (расход/возврат вручную не
// заводим), поэтому тип операции не выбирается, а всегда "Приход".
const MANUAL_OPERATION_TYPE = 1

const manualFields = reactive({
  fn: '',
  fd: '',
  fp: '',
  datetime: '',
  amount: '',
})

// Карточка ниже (.scan-page) нужна, только пока есть что показать — иначе
// это пустой блок с рамкой до первого скана.
const hasScanContent = computed(
  () =>
    isScanningImage.value ||
    isCheckingReceipt.value ||
    !!scannedPhotoUrl.value ||
    manualMode.value ||
    pendingReceipts.value.length > 0 ||
    scanBatchErrors.value.length > 0 ||
    !!scanLimitNotice.value
)

function resetManualFields() {
  manualFields.fn = ''
  manualFields.fd = ''
  manualFields.fp = ''
  manualFields.datetime = ''
  manualFields.amount = ''
  manualError.value = ''
}

const cancelManual = () => {
  manualMode.value = false
  resetManualFields()
}

// input[type=datetime-local] отдаёт "2026-09-14T20:28" — компактный формат
// ФФД (как в самом QR, см. §2.5 api_documentation.md) те же цифры без "-"/":".
const toFfdCompact = (value) => value.replace(/[-:]/g, '')

const submitManual = async () => {
  if (isCheckingReceipt.value) return

  if (
    !manualFields.fn.trim() ||
    !manualFields.fd.trim() ||
    !manualFields.fp.trim() ||
    !manualFields.datetime ||
    !manualFields.amount
  ) {
    manualError.value = 'Заполните все поля'
    return
  }

  isCheckingReceipt.value = true
  manualError.value = ''

  try {
    const data = await checkReceiptByRequisites({
      fn: manualFields.fn.trim(),
      fd: manualFields.fd.trim(),
      fp: manualFields.fp.trim(),
      t: toFfdCompact(manualFields.datetime),
      s: Number(manualFields.amount).toFixed(2),
      n: MANUAL_OPERATION_TYPE,
    })

    addPending(data)
    manualMode.value = false
    resetManualFields()
  } catch (error) {
    console.error('Ошибка при получении данных чека по реквизитам:', error)
    manualError.value =
      error instanceof ReceiptCheckError
        ? error.message
        : error?.message || 'Не удалось получить данные чека'
  } finally {
    isCheckingReceipt.value = false
  }
}

// Нормализация под показ — сырой ответ сервиса на разных чеках называет
// поля по-разному (см. комментарий у mapExternalReceipt в receiptCheck.utils.js),
// поэтому здесь тоже проверяем оба варианта, а не только документированный.
// Не computed — вызывается по одному на каждый элемент очереди в шаблоне.
function getSummary(item) {
  const data = item.data
  return {
    place: data.retailPlace ?? data.user ?? null,
    address: data.retailPlaceAddress ?? data.retailPlaceAddres ?? null,
    date: parseExternalDate(data.ticketDate ?? data.dateTime),
    operator: data.operator ?? null,
    fiscalDocumentNumber: data.fiscalDocumentNumber ?? null,
    fiscalSign: data.fiscalSign ?? null,
    totalSum: data.totalSum,
    items: data.items ?? [],
  }
}

// Общая сумма всех чеков в очереди (ещё не сохранённых) — totalSum уже в
// копейках, как и everywhere в проекте (см. formatMoney).
const pendingTotal = computed(() =>
  pendingReceipts.value.reduce(
    (sum, item) => sum + (item.data.totalSum ?? 0),
    0
  )
)

const formatDate = (date) => (date ? date.toLocaleString('ru-RU') : '')

const capitalize = (text) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text

const formatMoney = (value) => {
  if (value === undefined || value === null) {
    return '—'
  }

  return (Number(value) / 100).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  })
}

const handleReceiptError = (error) => {
  console.error('Ошибка при получении данных чека:', error)

  const message =
    error instanceof ReceiptCheckError
      ? error.message
      : error?.message || 'Не удалось получить данные чека'

  if (cameraOpen.value) {
    cameraError.value = message
  } else {
    console.error(message)
  }
}

/*
 * ============================================================
 * Камера — раскодируем QR локально (qr-scanner), дальше raw
 * отправляем на checkReceiptByRaw
 * ============================================================
 */
const handleQrDetected = async (raw) => {
  const qrraw = typeof raw === 'string' ? raw : raw?.data

  if (!qrraw || isCheckingReceipt.value) {
    return
  }

  // Останавливаем камеру СРАЗУ на первом же найденном QR, а не после ответа
  // API — иначе видео продолжает сканироваться всё время запроса/поллинга
  // (см. pollCheck) и тот же QR может засечься повторно, давая дубль чека.
  cameraScanner?.stop()

  isCheckingReceipt.value = true
  cameraError.value = ''

  try {
    const data = await checkReceiptByRaw(qrraw)

    const item = addPending(data, { raw: qrraw })

    closeCameraScanner()

    // Данные чека получены — предлагаем сфотографировать сам чек. Именно
    // через confirmModal, а не сразу input.click(): на мобильных браузерах
    // клик по input, вызванный уже ПОСЛЕ await сетевого запроса (checkReceiptByRaw
    // выше), не считается настоящим пользовательским жестом — камера не
    // откроется. Клик по "Да" в модалке — свежий жест прямо перед открытием.
    confirmModalStore.open(
      () => openAttachPhoto(item, { camera: true }),
      'Сфотографировать чек?'
    )
  } catch (error) {
    handleReceiptError(error)
    // Не удалось — даём попробовать ещё раз в той же открытой камере, а не
    // заставляем закрывать/открывать её заново.
    await cameraScanner?.start()
  } finally {
    isCheckingReceipt.value = false
  }
}

/*
 * ============================================================
 * Сканирование по фото — можно выбрать сразу несколько, каждое фото — один
 * чек, обрабатываем строго по одному (не параллельно — сторонний сервис
 * сам ограничивает частоту запросов, см. code:3 в proverkacheka.api.js)
 * ============================================================
 */
const MAX_SCAN_PHOTOS = 10

const scanBatch = reactive({ current: 0, total: 0 })
const scanLimitNotice = ref('')

// Фото, по которым не удалось получить данные чека (сервис не нашёл чек,
// лимит запросов и т.п.) — держим сам файл и его превью, чтобы можно было
// посмотреть, какое именно фото не распозналось (см. FilePreview.vue).
const scanBatchErrors = ref([])

function dismissBatchError(err) {
  URL.revokeObjectURL(err.url)
  scanBatchErrors.value = scanBatchErrors.value.filter((e) => e.id !== err.id)
}

function clearBatchErrors() {
  scanBatchErrors.value.forEach((err) => URL.revokeObjectURL(err.url))
  scanBatchErrors.value = []
}

const onQrFileSelected = async (event) => {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''

  if (!files.length || isCheckingReceipt.value) {
    return
  }

  const selected = files.slice(0, MAX_SCAN_PHOTOS)
  clearBatchErrors()
  scanLimitNotice.value =
    files.length > MAX_SCAN_PHOTOS
      ? `Можно загрузить не больше ${MAX_SCAN_PHOTOS} фото за раз — обработаны первые ${MAX_SCAN_PHOTOS}.`
      : ''

  isScanningImage.value = true
  scanBatch.total = selected.length
  scanBatch.current = 0

  for (const file of selected) {
    scanBatch.current += 1

    clearScannedPhoto()
    scannedPhotoFile.value = file
    scannedPhotoUrl.value = URL.createObjectURL(file)

    try {
      const data = await checkReceiptByImage(file)
      addPending(data, { photoFile: file })
    } catch (error) {
      console.error('Ошибка при получении данных чека:', error)
      const message =
        error instanceof ReceiptCheckError
          ? error.message
          : error?.message || 'Не удалось получить данные чека'
      scanBatchErrors.value.push({
        id: crypto.randomUUID(),
        file,
        fileName: file.name,
        message,
        url: URL.createObjectURL(file),
      })
    }
  }

  clearScannedPhoto()
  isScanningImage.value = false
}

/*
 * ============================================================
 * Камера
 * ============================================================
 */

const openCameraScanner = async () => {
  if (cameraOpen.value || isCheckingReceipt.value) {
    return
  }

  cameraError.value = ''
  cameraOpen.value = true

  await nextTick()

  if (!qrVideo.value) {
    cameraError.value = 'Не удалось инициализировать камеру.'
    return
  }

  cameraScanner = new QrScanner(
    qrVideo.value,

    async (result) => {
      const raw = typeof result === 'string' ? result : result?.data

      if (!raw) {
        return
      }

      await handleQrDetected(raw)
    },
    {
      returnDetailedScanResult: true,
      highlightScanRegion: true,
      highlightCodeOutline: true,
    }
  )

  try {
    await cameraScanner.start()
  } catch (error) {
    console.error('Ошибка доступа к камере:', error)

    cameraError.value =
      'Не удалось получить доступ к камере. Проверьте разрешения браузера.'
  }
}

const closeCameraScanner = () => {
  cameraOpen.value = false

  if (cameraScanner) {
    cameraScanner.stop()
    cameraScanner.destroy()
    cameraScanner = null
  }
}

function clearScannedPhoto() {
  if (scannedPhotoUrl.value) URL.revokeObjectURL(scannedPhotoUrl.value)
  scannedPhotoFile.value = null
  scannedPhotoUrl.value = ''
}

// Сохранение одного чека из очереди — маппинг ответа внешнего API уже
// сделан в receiptCheck.utils.js. Успех убирает элемент из очереди, ошибка
// остаётся при нём же (остальные элементы очереди не трогает).
const addOnePending = async (item) => {
  if (item.isAdding) return

  if (!userStore.user?.id) {
    item.addError = 'Не удалось определить текущего пользователя'
    return
  }

  item.isAdding = true
  item.addError = ''

  try {
    const payload = {
      userId: userStore.user.id,
      ...mapExternalReceipt(item.data, item.rawQr),
    }

    const created = await receiptStore.addReceipt(payload)

    if (item.attachPhoto && item.photoFile) {
      try {
        await uploadReceiptFile(created.id, item.photoFile)
      } catch (error) {
        console.error('Чек создан, но не удалось прикрепить фото:', error)
      }
    }

    removePending(item)
  } catch (error) {
    console.error('Не удалось добавить чек:', error)
    // Текст с бэка приходит с маленькой буквы (см. errors.New(...) в
    // internal/receipt/service.go) — с большой смотрится как предложение.
    item.addError = capitalize(error?.message) || 'Не удалось добавить чек'
  } finally {
    item.isAdding = false
  }
}

// Добавление всех чеков очереди разом — по одному, чтобы ошибка на одном
// чеке не мешала сохранить остальные (упавший просто остаётся в очереди).
const isAddingAll = ref(false)

const addAllPending = async () => {
  if (isAddingAll.value) return

  isAddingAll.value = true
  try {
    for (const item of [...pendingReceipts.value]) {
      await addOnePending(item)
    }
  } finally {
    isAddingAll.value = false
  }
}

onBeforeUnmount(() => {
  closeCameraScanner()
  clearScannedPhoto()
  pendingReceipts.value.forEach((item) => {
    if (item.photoUrl) URL.revokeObjectURL(item.photoUrl)
  })
  clearBatchErrors()
})
</script>

<style scoped>
/* Единая карточка страницы — как .receipt-list у соседней вкладки "Чеки",
   чтобы обе вкладки читались как одна и та же страница, а не по-разному. */
.scan-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);

  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);

  padding: var(--padding-secondary);
  height: 100%;
}

.scan-block {
  display: flex;
  flex-direction: column;
  gap: 0.57rem;
}

/* Отдельный блок, не часть .scan-page — стоит своей карточкой над ней,
   как .scan-page стоит своей карточкой относительно .receipt-list. */
.scan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.57rem;

  padding: var(--padding-secondary);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.scan-block__status {
  display: flex;
  align-items: center;
  gap: 0.57rem;
  color: var(--muted-text);
  font-size: 0.93rem;
}

.scan-block__photo {
  display: flex;
  align-items: center;
  gap: 0.86rem;
  padding: 0.57rem;
  background: var(--background);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.scan-block__photo img {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: cover;
  border-radius: var(--border-radius);
  flex-shrink: 0;
}

.scan-block__photo-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.86rem;
  flex: 1;
  min-width: 0;
}

.scan-block__photo-label {
  font-size: 0.93rem;
  color: var(--muted-text);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.57rem;
  cursor: pointer;
  font-size: 0.93rem;
}

.checkbox-label input[type='checkbox'] {
  width: auto;
  cursor: pointer;
}

.scan-block__photo-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted-text);
  font-size: 1rem;
  flex-shrink: 0;
}

.scan-block__photo-remove:hover {
  color: var(--destructive);
}

.scan-block__notice {
  font-size: 0.86rem;
  color: var(--muted-text);
}

.scan-block__batch-errors {
  display: flex;
  flex-direction: column;
  gap: 0.43rem;
}

.scan-block__batch-error {
  display: flex;
  align-items: center;
  gap: 0.71rem;

  padding: 0.5rem;
  background: var(--background);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.scan-block__batch-error-thumb {
  flex-shrink: 0;
  width: 2.8rem;
  height: 2.8rem;
  padding: 0;
  border: none;
  border-radius: var(--border-radius);
  overflow: hidden;
  cursor: pointer;
}

.scan-block__batch-error-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scan-block__batch-error-text {
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
  min-width: 0;
  flex: 1;
}

.scan-block__batch-error-name {
  font-size: 0.86rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scan-block__batch-error-message {
  font-size: 0.8rem;
  color: var(--destructive);
}

/* ================== Camera ================== */

.qr-camera {
  display: flex;
  align-items: center;
  justify-content: center;

  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  z-index: 200;
  animation: scanModalIn 0.3s ease;
}

.qr-camera__back {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  /* Тот же полупрозрачный серый фон, что у общего ModalLayout.vue, а не
     произвольный чёрный — иначе камера выглядит как модалка из другого
     приложения. */
  background: #9c9c9c50;

  z-index: 199;
}

.qr-camera__container {
  position: relative;
  z-index: 201;

  display: flex;
  flex-direction: column;
  gap: 0.86rem;

  padding: 1.14rem;

  background: var(--foreground);
  border-radius: var(--border-radius);

  width: 100%;
  max-width: 26rem;

  margin: 1rem;
}

.qr-camera__header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.86rem;

  font-weight: 600;
}

.qr-camera__close {
  cursor: pointer;
}

.qr-camera__close:hover {
  color: var(--accent);
}

.qr-camera__video {
  width: 100%;
  max-height: 20rem;

  border-radius: var(--border-radius);

  background: #000;

  object-fit: cover;
}

.qr-camera__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.57rem;

  font-size: 0.93rem;
  color: var(--muted-text);
}

.qr-camera__error {
  font-size: 0.86rem;
  color: var(--destructive);
}

@keyframes scanModalIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* ================== Ручной ввод реквизитов ================== */

.manual-form {
  display: flex;
  flex-direction: column;
  gap: 0.86rem;
}

.manual-form__hint {
  font-size: 0.86rem;
  color: var(--muted-text);
}

.manual-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.86rem;
}

@media (max-width: 768px) {
  .manual-form__grid {
    grid-template-columns: 1fr;
  }
}

.manual-form__error {
  font-size: 0.86rem;
  color: var(--destructive);
}

.manual-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.57rem;
}

/* ================== Очередь чеков ================== */

.pending-bulk {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.86rem;

  padding: 0.71rem 0.86rem;
  background: var(--background);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.pending-bulk__info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.29rem 0.86rem;
}

.pending-bulk__count {
  font-size: 0.93rem;
  font-weight: 600;
}

.pending-bulk__total {
  font-size: 0.93rem;
  color: var(--muted-text);
}

/* ================== Receipt result ================== */
/* Секция очереди, не отдельная вложенная карточка — фон/рамку задаёт
   .scan-page, здесь только внутренние отступы между блоками. */

.receipt-result {
  display: flex;
  flex-direction: column;
  gap: 0.86rem;
}

/* Разделитель только МЕЖДУ карточками очереди, не над самой первой (её
   соседи выше — .scan-block/.manual-form/.pending-bulk, тоже <div>, так что
   :first-of-type тут не сработал бы). */
.receipt-result + .receipt-result {
  padding-top: var(--padding-secondary);
  border-top: 0.07rem solid var(--border-color);
}

.receipt-result__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.receipt-result__header h3 {
  margin: 0;
  font-size: 1rem;
}

.receipt-result__clear {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted-text);
}

.receipt-result__clear:hover {
  color: var(--destructive);
}

.receipt-result__summary {
  display: flex;
  flex-direction: column;
  gap: 0.29rem;
}

.receipt-result__row {
  display: flex;
  justify-content: space-between;
  gap: 0.86rem;
  font-size: 0.93rem;
}

.receipt-result__label {
  color: var(--muted-text);
  flex-shrink: 0;
}

.receipt-result__items-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.43rem;
  align-self: flex-start;

  background: none;
  border: none;
  padding: 0;
  color: var(--muted-text);
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
}

.receipt-result__items-toggle:hover {
  color: var(--accent);
}

.receipt-result__items-toggle--open {
  color: var(--accent);
}

.receipt-result__items-toggle i {
  transition: transform 0.15s ease;
}

.receipt-result__items-chevron--open {
  transform: rotate(90deg);
}

/* Позиции чека могут быть широкими (5 колонок) — на мобильном таблица не
   лезет в ширину экрана, скроллим саму обёртку, а не всю страницу. */
.receipt-result__items-wrap {
  overflow-x: auto;

  padding: 0.5rem 0.71rem;
  background: var(--background);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.receipt-result__items {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.receipt-result__items th,
.receipt-result__items td {
  padding: 0.43rem;
  border-bottom: 0.07rem solid var(--border-color);
  text-align: left;
}

.receipt-result__items th:nth-child(1),
.receipt-result__items td:nth-child(1) {
  width: 2rem;
}

.receipt-result__items th:nth-child(3),
.receipt-result__items td:nth-child(3),
.receipt-result__items th:nth-child(4),
.receipt-result__items td:nth-child(4),
.receipt-result__items th:nth-child(5),
.receipt-result__items td:nth-child(5) {
  text-align: right;
}

.receipt-result__total {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}

.pending-attach-photo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;

  padding: 0.5rem 0.71rem;
  background: none;
  border: 0.07rem dashed var(--border-color);
  border-radius: var(--border-radius);
  color: var(--muted-text);
  font-size: 0.86rem;
  cursor: pointer;
}

.pending-attach-photo:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.receipt-result__footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.receipt-result__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.57rem;
}

.receipt-result__error {
  font-size: 0.86rem;
  color: var(--destructive);
}

@media (max-width: 768px) {
  /* Кнопки способа сканирования — в столбец на всю ширину, легче попасть
     пальцем, чем в обтекающий ряд из трёх кнопок. */
  .scan-actions {
    flex-direction: column;
  }

  .scan-actions > button {
    width: 100%;
  }

  /* "Место расчётов"/"Адрес" и т.п. — значение может быть длинным (особенно
     адрес), в одну строку с лейблом на узком экране оно просто сплющится.
     Переносим значение под лейбл и даём ему нормально переноситься. */
  .receipt-result__row {
    flex-direction: column;
    gap: 0.14rem;
  }

  .receipt-result__label {
    font-size: 0.8rem;
  }

  .scan-block__photo-info {
    flex-wrap: wrap;
  }

  .pending-bulk {
    flex-direction: column;
    align-items: stretch;
  }

  .pending-bulk > button {
    width: 100%;
  }

  /* Кнопки в подвале карточки — поровну на всю ширину, а не жаться друг к
     другу справа. */
  .manual-form__actions,
  .receipt-result__actions {
    justify-content: stretch;
  }

  .manual-form__actions > button,
  .receipt-result__actions > button {
    flex: 1;
  }
}
</style>
