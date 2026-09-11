<template>
  <div class="receipt-form">
    <div class="receipt-form__title">Добавить чек</div>

    <!-- ================== Сканирование QR ================== -->
    <div class="scan-block">
      <div class="scan-block__actions">
        <ButtonUI
          type="muted"
          icon="fa-regular fa-image"
          :disabled="
            isLoading || isScanningImage || isCheckingReceipt || cameraOpen
          "
          @click="qrFileInput.click()"
        >
          Сканировать по фото
        </ButtonUI>

        <ButtonUI
          type="muted"
          icon="fa-regular fa-camera"
          :disabled="
            isLoading || isScanningImage || isCheckingReceipt || cameraOpen
          "
          @click="openCameraScanner"
        >
          Сканировать камерой
        </ButtonUI>

        <input
          ref="qrFileInput"
          type="file"
          accept="image/*"
          capture="environment"
          style="display: none"
          @change="onQrFileSelected"
        />
      </div>

      <div v-if="isScanningImage" class="scan-block__status">
        <i class="fa-regular fa-spinner fa-spin"></i>
        Распознаём QR-код...
      </div>

      <div v-if="isCheckingReceipt" class="scan-block__status">
        <i class="fa-regular fa-spinner fa-spin"></i>
        Получаем данные чека...
      </div>

      <div v-if="scannedPhotoUrl" class="scan-block__photo">
        <img :src="scannedPhotoUrl" alt="Скан чека" />

        <div class="scan-block__photo-info">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="attachScannedPhoto"
              :disabled="isLoading"
            />
            <span>Прикрепить это фото к чеку</span>
          </label>

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
    </div>

    <!-- ================== Камера ================== -->
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

    <!-- ================== Основные поля ================== -->

    <div class="field-wrapper">
      <InputUi
        v-model="formData.ticketDate"
        type="date"
        label="Дата покупки"
        :required="true"
        :disabled="isLoading"
        :error="errors.ticketDate"
        @input="errors.ticketDate = null"
      />
    </div>

    <div class="field-row">
      <div class="field-wrapper">
        <InputUi
          v-model="formData.sellerName"
          type="text"
          label="Продавец"
          :disabled="isLoading"
        />
      </div>

      <div class="field-wrapper">
        <InputUi
          v-model="formData.sellerInn"
          type="text"
          label="ИНН продавца"
          :required="true"
          :disabled="isLoading"
          :error="errors.sellerInn"
          @input="errors.sellerInn = null"
        />
      </div>
    </div>

    <div class="field-wrapper">
      <InputUi
        v-model="formData.totalSum"
        type="number"
        label="Сумма чека, ₽"
        :required="true"
        :disabled="isLoading"
        :error="errors.totalSum"
        @input="errors.totalSum = null"
      />
    </div>

    <!-- ================== Фискальные реквизиты ================== -->

    <div class="field-wrapper">
      <div class="field-wrapper__fiscal-label">Фискальные реквизиты чека</div>

      <div class="field-row">
        <InputUi
          v-model="formData.fiscalDriveNumber"
          type="text"
          label="ФН"
          :required="true"
          :disabled="isLoading"
          :error="errors.fiscalDriveNumber"
          @input="errors.fiscalDriveNumber = null"
        />

        <InputUi
          v-model="formData.fiscalDocumentNumber"
          type="text"
          label="ФД"
          :required="true"
          :disabled="isLoading"
          :error="errors.fiscalDocumentNumber"
          @input="errors.fiscalDocumentNumber = null"
        />

        <InputUi
          v-model="formData.fiscalSign"
          type="text"
          label="ФПД"
          :required="true"
          :disabled="isLoading"
          :error="errors.fiscalSign"
          @input="errors.fiscalSign = null"
        />
      </div>
    </div>

    <!-- ================== Позиции ================== -->

    <div class="field-wrapper">
      <div class="items-header">
        <span class="field-label">
          Позиции
          <span class="required">*</span>
        </span>

        <ButtonUI
          type="muted"
          icon="fa-regular fa-plus"
          :disabled="isLoading"
          @click="addItem"
        >
          Добавить позицию
        </ButtonUI>
      </div>

      <span v-if="errors.items" class="error-message">
        {{ errors.items }}
      </span>

      <div
        v-for="(item, index) in formData.items"
        :key="index"
        class="item-row"
      >
        <InputUi
          v-model="item.name"
          type="text"
          placeholder="Наименование"
          :disabled="isLoading"
        />

        <InputUi
          v-model="item.quantity"
          type="number"
          placeholder="Кол-во"
          :disabled="isLoading"
        />

        <InputUi
          v-model="item.price"
          type="number"
          placeholder="Цена, ₽"
          :disabled="isLoading"
        />

        <ButtonUI
          type="destructive"
          icon="fa-regular fa-trash-can-xmark"
          :disabled="isLoading"
          @click="removeItem(index)"
          v-tooltip="'Удалить позицию'"
        />
      </div>
    </div>

    <!-- ================== Дополнительные поля ================== -->

    <button
      type="button"
      class="advanced-toggle"
      @click="advancedOpen = !advancedOpen"
    >
      <i
        :class="
          advancedOpen
            ? 'fa-regular fa-chevron-up'
            : 'fa-regular fa-chevron-down'
        "
      ></i>

      Дополнительные поля
    </button>

    <template v-if="advancedOpen">
      <div class="field-wrapper">
        <InputUi
          v-model="formData.retailPlaceAddress"
          type="text"
          label="Адрес точки продаж"
          :disabled="isLoading"
        />
      </div>

      <div class="field-row">
        <InputUi
          v-model="formData.cashTotalSum"
          type="number"
          label="Наличными, ₽"
          :disabled="isLoading"
        />

        <InputUi
          v-model="formData.ecashTotalSum"
          type="number"
          label="Безналичными, ₽"
          :disabled="isLoading"
        />
      </div>

      <div class="field-wrapper">
        <label class="field-label">Система налогообложения</label>

        <SelectUI
          v-model="formData.taxationType"
          :options="taxationTypeOptions"
          label-key="label"
          value-key="value"
          placeholder="Не указано"
          full-width
          style="width: 100%"
          :disabled="isLoading"
        />
      </div>
    </template>

    <!-- ================== Сохранение ================== -->

    <div class="form-actions">
      <ButtonUI
        :disabled="
          isLoading || isSubmitting || isScanningImage || isCheckingReceipt
        "
        @click="handleSubmit"
      >
        <span v-if="isSubmitting">Сохранение...</span>

        <span v-else>Добавить чек</span>
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import SelectUI from '@/components/SelectUI.vue'

import { uploadReceiptFile } from '@/services/receipt.api'

import { useNotificationStore } from '@/stores/notification'
import { useReceiptStore } from '@/stores/receipt'
import { useUserStore } from '@/stores/user'

import {
  OPERATION_TYPE_LABELS,
  TAXATION_TYPE_LABELS,
} from '@/utils/receipt.utils'

import QrScanner from 'qr-scanner'
import QrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url'

import { nextTick, onBeforeUnmount, reactive, ref } from 'vue'

QrScanner.WORKER_PATH = QrScannerWorkerPath

const emit = defineEmits(['success'])

const userStore = useUserStore()
const receiptStore = useReceiptStore()
const notificationStore = useNotificationStore()

/*
 * ============================================================
 * Настройки внешнего API "Проверка чека онлайн"
 * ============================================================
 *
 * .env:
 *
 * VITE_PROVERKACHEKA_TOKEN=твой_токен
 *
 * После изменения .env необходимо перезапустить Vite.
 */

const PROVERKACHEKA_TOKEN = import.meta.env.VITE_PROVERKACHEKA_TOKEN

const PROVERKACHEKA_URL = 'https://proverkacheka.com/api/v1/check/get'

/*
 * ============================================================
 * Options
 * ============================================================
 */

const operationTypeOptions = Object.entries(OPERATION_TYPE_LABELS).map(
  ([value, label]) => ({
    value: Number(value),
    label,
  })
)

const taxationTypeOptions = Object.entries(TAXATION_TYPE_LABELS).map(
  ([value, label]) => ({
    value: Number(value),
    label,
  })
)

/*
 * ============================================================
 * Form
 * ============================================================
 */

const createEmptyItem = () => ({
  name: '',
  quantity: 1,
  price: '',
})

const createEmptyForm = () => ({
  ticketDate: '',
  sellerName: '',
  sellerInn: '',
  operationType: 1,
  totalSum: '',

  fiscalDriveNumber: '',
  fiscalDocumentNumber: '',
  fiscalSign: '',

  retailPlaceAddress: '',

  cashTotalSum: '',
  ecashTotalSum: '',

  taxationType: null,

  /*
   * Сохраняем исходный QR.
   * Передадим его при создании чека.
   */
  rawQr: '',

  /*
   * Номер запроса внешнего API.
   * Может пригодиться для повторного запроса,
   * если API вернул code = 2.
   */
  requestNumber: '',

  items: [createEmptyItem()],
})

const formData = reactive(createEmptyForm())

const errors = reactive({
  ticketDate: null,
  sellerInn: null,
  totalSum: null,
  fiscalDriveNumber: null,
  fiscalDocumentNumber: null,
  fiscalSign: null,
  items: null,
})

const advancedOpen = ref(false)

const isSubmitting = ref(false)
const isLoading = ref(false)

/*
 * Флаг отдельного запроса к API.
 *
 * Особенно важен для камеры:
 * qr-scanner может несколько раз подряд
 * обнаружить один и тот же QR.
 */
const isCheckingReceipt = ref(false)

/*
 * ============================================================
 * Items
 * ============================================================
 */

const addItem = () => {
  formData.items.push(createEmptyItem())
}

const removeItem = (index) => {
  if (formData.items.length <= 1) {
    return
  }

  formData.items.splice(index, 1)
}

/*
 * ============================================================
 * Utils
 * ============================================================
 */

/*
 * В форме суммы хранятся в рублях.
 * В API/БД — копейки.
 */
const toKopecks = (rubles) => {
  const value = Number(rubles)

  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.round(value * 100)
}

/*
 * Перевод копеек в рубли.
 */
const fromKopecks = (kopecks) => {
  if (kopecks === null || kopecks === undefined) {
    return ''
  }

  const value = Number(kopecks)

  if (!Number.isFinite(value)) {
    return ''
  }

  return value / 100
}

/*
 * API возвращает дату примерно в формате:
 *
 * 2024-01-15T12:30:00
 *
 * или:
 *
 * 20240115T123000
 *
 * Нам для <input type="date"> нужен:
 *
 * 2024-01-15
 */
const formatTicketDate = (value) => {
  if (!value) {
    return ''
  }

  const stringValue = String(value)

  /*
   * 20240115T123000
   */
  const compactMatch = stringValue.match(/^(\d{4})(\d{2})(\d{2})T/)

  if (compactMatch) {
    return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`
  }

  /*
   * ISO:
   * 2024-01-15T12:30:00
   */
  const isoMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }

  /*
   * На всякий случай пробуем Date.
   */
  const date = new Date(value)

  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  return ''
}

/*
 * ============================================================
 * Validation
 * ============================================================
 */

const validate = () => {
  let valid = true

  if (!formData.ticketDate) {
    errors.ticketDate = 'Поле обязательно'
    valid = false
  } else {
    errors.ticketDate = null
  }

  if (!formData.sellerInn) {
    errors.sellerInn = 'Поле обязательно'
    valid = false
  } else {
    errors.sellerInn = null
  }

  if (!formData.totalSum || Number(formData.totalSum) <= 0) {
    errors.totalSum = 'Укажите сумму чека'
    valid = false
  } else {
    errors.totalSum = null
  }

  if (!formData.fiscalDriveNumber) {
    errors.fiscalDriveNumber = 'Поле обязательно'
    valid = false
  } else {
    errors.fiscalDriveNumber = null
  }

  if (!formData.fiscalDocumentNumber) {
    errors.fiscalDocumentNumber = 'Поле обязательно'
    valid = false
  } else {
    errors.fiscalDocumentNumber = null
  }

  if (!formData.fiscalSign) {
    errors.fiscalSign = 'Поле обязательно'
    valid = false
  } else {
    errors.fiscalSign = null
  }

  const validItems = formData.items.filter(
    (item) => item.name && Number(item.price) > 0
  )

  if (validItems.length === 0) {
    errors.items = 'Добавьте хотя бы одну позицию с названием и ценой'

    valid = false
  } else {
    errors.items = null
  }

  return valid
}

/*
 * ============================================================
 * QR scanner
 * ============================================================
 */

const qrFileInput = ref(null)
const qrVideo = ref(null)

let cameraScanner = null

const isScanningImage = ref(false)
const cameraOpen = ref(false)
const cameraError = ref('')

const scannedPhotoFile = ref(null)
const scannedPhotoUrl = ref('')
const attachScannedPhoto = ref(true)

/*
 * ============================================================
 * Проверка QR через "Проверка чека онлайн"
 * ============================================================
 *
 * В отличие от старой реализации мы НЕ разбираем QR
 * самостоятельно.
 *
 * Передаём исходную строку:
 *
 * qrraw=...
 *
 * Сервис сам извлекает:
 *
 * fn
 * fd
 * fp
 * t
 * n
 * s
 *
 * и остальные данные чека.
 * ============================================================
 */

const getReceiptByQr = async (rawQr) => {
  if (!PROVERKACHEKA_TOKEN) {
    throw new Error('Не задан VITE_PROVERKACHEKA_TOKEN')
  }

  const qrraw = String(rawQr || '').trim()

  if (!qrraw) {
    throw new Error('QR-код пустой')
  }

  // Используем FormData вместо JSON
  const formData = new FormData()
  formData.append('token', PROVERKACHEKA_TOKEN)
  formData.append('qrraw', qrraw)

  const response = await fetch(PROVERKACHEKA_URL, {
    method: 'POST',
    // Не указываем 'Content-Type', браузер подставит multipart/form-data автоматически
    body: formData,
  })

  let data

  try {
    data = await response.json()
  } catch {
    throw new Error(
      `Сервис проверки чека вернул некорректный ответ (${response.status})`
    )
  }

  if (!response.ok || data?.code === 0) {
    throw new Error(
      data?.message || `Ошибка сервиса проверки чека (${response.status})`
    )
  }

  return data
}

/*
 * ============================================================
 * Нормализация ответа API
 * ============================================================
 */

const getReceiptJson = (response) => {
  if (!response) {
    return null
  }

  /*
   * По спецификации:
   *
   * data.json
   */

  let json = response?.data?.json

  /*
   * Иногда JSON может прийти строкой.
   */
  if (typeof json === 'string') {
    try {
      json = JSON.parse(json)
    } catch {
      return null
    }
  }

  return json || null
}

/*
 * Цена позиции.
 *
 * В API есть:
 *
 * item.price
 * item.sum
 *
 * При этом sum точно указан в копейках.
 *
 * Поэтому если есть sum и quantity —
 * считаем цену из суммы позиции.
 *
 * Если sum отсутствует — используем price.
 */
const getItemPriceInRubles = (item) => {
  const quantity = Number(item?.quantity) || 1

  if (item?.sum !== undefined && item?.sum !== null) {
    const sum = Number(item.sum)

    if (Number.isFinite(sum)) {
      return sum / 100 / quantity
    }
  }

  if (item?.price !== undefined && item?.price !== null) {
    const price = Number(item.price)

    if (Number.isFinite(price)) {
      return price / 100
    }
  }

  return ''
}

/*
 * ============================================================
 * Заполнение формы данными внешнего API
 * ============================================================
 */

const applyReceiptFromApi = (response) => {
  const receipt = getReceiptJson(response)

  if (!receipt) {
    throw new Error('В ответе сервиса отсутствуют данные чека')
  }

  /*
   * Основные данные
   */

  formData.ticketDate = formatTicketDate(receipt.ticketDate)

  formData.sellerName = receipt.user ?? ''

  formData.sellerInn = receipt.userInn ?? ''

  formData.operationType =
    receipt.operationType !== undefined && receipt.operationType !== null
      ? Number(receipt.operationType)
      : 1

  formData.totalSum = fromKopecks(receipt.totalSum)

  /*
   * Фискальные реквизиты
   */

  formData.fiscalDriveNumber = receipt.fiscalDriveNumber ?? ''

  formData.fiscalDocumentNumber = receipt.fiscalDocumentNumber ?? ''

  formData.fiscalSign = receipt.fiscalSign ?? ''

  /*
   * Дополнительные данные
   *
   * В API название поля именно:
   *
   * retailPlaceAddres
   *
   * без последней "s".
   */

  formData.retailPlaceAddress = receipt.retailPlaceAddres ?? ''

  formData.cashTotalSum = fromKopecks(receipt.cashTotalSum)

  formData.ecashTotalSum = fromKopecks(receipt.ecashTotalSum)

  formData.taxationType =
    receipt.taxationType !== undefined && receipt.taxationType !== null
      ? Number(receipt.taxationType)
      : null

  /*
   * Позиции.
   */

  if (Array.isArray(receipt.items) && receipt.items.length > 0) {
    formData.items = receipt.items.map((item) => ({
      name: item?.name ?? '',

      quantity: Number(item?.quantity) || 1,

      price: getItemPriceInRubles(item),
    }))
  } else {
    formData.items = [createEmptyItem()]
  }

  /*
   * Если в ответе есть номер запроса —
   * сохраняем его.
   */

  formData.requestNumber =
    response?.data?.requestNumber ?? response?.requestNumber ?? ''

  /*
   * Очищаем ошибки полей,
   * которые теперь пришли из API.
   */

  errors.ticketDate = null
  errors.sellerInn = null
  errors.totalSum = null
  errors.fiscalDriveNumber = null
  errors.fiscalDocumentNumber = null
  errors.fiscalSign = null

  if (formData.items.some((item) => item.name && Number(item.price) > 0)) {
    errors.items = null
  }

  /*
   * Если дополнительные поля были получены,
   * автоматически открываем блок.
   */

  if (
    formData.retailPlaceAddress ||
    formData.cashTotalSum !== '' ||
    formData.ecashTotalSum !== '' ||
    formData.taxationType !== null
  ) {
    advancedOpen.value = true
  }

  return receipt
}

/*
 * ============================================================
 * Обработка ответа сервиса
 * ============================================================
 */

const processReceiptApiResponse = (response) => {
  /*
   * Коды согласно API:
   *
   * 0 — некорректный запрос / данные
   * 1 — данные получены
   * 2 — данные ещё не получены
   * 3 — слишком много запросов
   * 4 — необходимо подождать
   * 5 — другие ошибки
   */

  const code = Number(response?.code)

  switch (code) {
    case 1: {
      applyReceiptFromApi(response)

      notificationStore.addNotification(
        'Чек найден, данные заполнены',
        'success'
      )

      return true
    }

    case 2:
      notificationStore.addNotification(
        'Чек найден, но данные ещё не готовы. Попробуйте повторить сканирование немного позже.',
        'warning'
      )

      return false

    case 3:
      notificationStore.addNotification(
        'Превышен лимит запросов к сервису проверки чеков',
        'error'
      )

      return false

    case 4:
      notificationStore.addNotification(
        'Сервис просит немного подождать перед повторным запросом',
        'warning'
      )

      return false

    case 0:
      notificationStore.addNotification(
        'Сервис не смог распознать данные чека',
        'error'
      )

      return false

    case 5:
    default:
      notificationStore.addNotification(
        'Не удалось получить данные чека из внешнего сервиса',
        'error'
      )

      return false
  }
}

/*
 * ============================================================
 * Единая обработка обнаруженного QR
 * ============================================================
 */

const handleQrDetected = async (raw) => {
  /*
   * Камера может обнаружить один QR несколько раз подряд.
   *
   * Пока первый запрос выполняется,
   * остальные игнорируем.
   */

  if (isCheckingReceipt.value) {
    return
  }

  const qrraw = typeof raw === 'string' ? raw : raw?.data

  if (!qrraw) {
    return
  }

  isCheckingReceipt.value = true

  try {
    /*
     * Сохраняем оригинальный QR.
     */
    formData.rawQr = qrraw

    const response = await getReceiptByQr(qrraw)

    const success = processReceiptApiResponse(response)

    /*
     * Закрываем камеру только если
     * данные реально получили.
     *
     * Если code=2/4 — оставляем камеру открытой,
     * чтобы пользователь мог продолжить.
     */

    if (success) {
      closeCameraScanner()
    }
  } catch (error) {
    console.error('Ошибка при получении данных чека:', error)

    notificationStore.addNotification(
      error?.message || 'Не удалось получить данные чека',
      'error'
    )
  } finally {
    isCheckingReceipt.value = false
  }
}

/*
 * ============================================================
 * Сканирование QR по фотографии
 * ============================================================
 */

const onQrFileSelected = async (event) => {
  const file = event.target.files?.[0]

  /*
   * Позволяет выбрать тот же файл ещё раз.
   */
  event.target.value = ''

  if (!file) {
    return
  }

  isScanningImage.value = true

  try {
    /*
     * Сначала локально распознаём QR.
     *
     * qr-scanner НЕ разбирает чек.
     * Он только получает строку QR.
     */

    const result = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    })

    const raw = typeof result === 'string' ? result : result?.data

    if (!raw) {
      throw new Error('Не удалось получить содержимое QR-кода')
    }

    /*
     * Сохраняем фотографию.
     */

    clearScannedPhoto()

    scannedPhotoFile.value = file

    scannedPhotoUrl.value = URL.createObjectURL(file)

    attachScannedPhoto.value = true

    /*
     * Теперь отправляем QR
     * во внешний сервис.
     */

    await handleQrDetected(raw)
  } catch (error) {
    console.error('Ошибка при распознавании QR по фото:', error)

    /*
     * Если handleQrDetected уже показал
     * ошибку API, здесь не показываем вторую.
     */

    if (!formData.rawQr) {
      notificationStore.addNotification(
        'Не удалось распознать QR-код на фото',
        'error'
      )
    }
  } finally {
    isScanningImage.value = false
  }
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
      /*
       * qr-scanner вызывает callback каждый раз,
       * когда видит QR.
       *
       * Поэтому здесь обязательно используем
       * isCheckingReceipt.
       */

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

/*
 * ============================================================
 * Фото
 * ============================================================
 */

const clearScannedPhoto = () => {
  if (scannedPhotoUrl.value) {
    URL.revokeObjectURL(scannedPhotoUrl.value)
  }

  scannedPhotoUrl.value = ''
  scannedPhotoFile.value = null
}

/*
 * ============================================================
 * Submit
 * ============================================================
 */

const handleSubmit = async () => {
  if (!validate() || isLoading.value || isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    /*
     * Позиции преобразуем в формат,
     * который ожидает бэк:
     *
     * price — цена одной единицы в копейках
     * sum   — сумма позиции в копейках
     */

    const items = formData.items
      .filter((item) => item.name && Number(item.price) > 0)
      .map((item) => {
        const quantity = Number(item.quantity) || 1

        const price = toKopecks(item.price)

        return {
          name: item.name,

          quantity,

          price,

          sum: price * quantity,
        }
      })

    /*
     * Создание чека.
     */

    const created = await receiptStore.addReceipt({
      userId: userStore.user.id,

      fiscalDriveNumber: formData.fiscalDriveNumber,

      fiscalDocumentNumber: formData.fiscalDocumentNumber,

      fiscalSign: formData.fiscalSign,

      ticketDate: new Date(formData.ticketDate),

      totalSum: toKopecks(formData.totalSum),

      sellerInn: formData.sellerInn,

      sellerName: formData.sellerName || undefined,

      operationType: formData.operationType,

      retailPlaceAddress: formData.retailPlaceAddress || undefined,

      cashTotalSum:
        formData.cashTotalSum !== ''
          ? toKopecks(formData.cashTotalSum)
          : undefined,

      ecashTotalSum:
        formData.ecashTotalSum !== ''
          ? toKopecks(formData.ecashTotalSum)
          : undefined,

      taxationType: formData.taxationType ?? undefined,

      /*
       * Эти поля можно сохранить,
       * если бэк их поддерживает.
       */

      requestNumber: formData.requestNumber || undefined,

      rawQr: formData.rawQr || undefined,

      items,
    })

    /*
     * Фото, с которого сканировали QR,
     * прикрепляем отдельным запросом.
     */

    if (scannedPhotoFile.value && attachScannedPhoto.value) {
      try {
        await uploadReceiptFile(created.id, scannedPhotoFile.value)
      } catch (fileError) {
        console.error('Ошибка при прикреплении фото чека:', fileError)

        notificationStore.addNotification(
          'Чек добавлен, но не удалось прикрепить фото',
          'error'
        )
      }
    }

    notificationStore.addNotification('Чек добавлен!', 'success')

    /*
     * Сбрасываем форму.
     */

    Object.assign(formData, createEmptyForm())

    clearScannedPhoto()

    attachScannedPhoto.value = true
    advancedOpen.value = false

    emit('success')
  } catch (error) {
    console.error('Ошибка при сохранении чека:', error)

    /*
     * 409 — чек уже существует.
     */

    if (error?.response?.status === 409) {
      notificationStore.addNotification(
        'Этот чек уже был добавлен ранее',
        'error'
      )
    } else {
      notificationStore.addNotification('Не удалось добавить чек', 'error')
    }
  } finally {
    isSubmitting.value = false
  }
}

/*
 * ============================================================
 * Lifecycle
 * ============================================================
 */

onBeforeUnmount(() => {
  closeCameraScanner()
  clearScannedPhoto()
})
</script>

<style scoped>
.receipt-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);

  min-width: 20rem;
  max-width: 32rem;
}

.receipt-form__title {
  font-size: 1.2rem;
  font-weight: 600;
}

.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.43rem;
}

.field-wrapper__fiscal-label {
  font-size: 0.93rem;
  font-weight: 500;
  color: var(--text-primary);
}

.field-row {
  display: flex;
  gap: 0.71rem;
}

.field-row > * {
  flex: 1;
  min-width: 0;
}

.field-label {
  font-size: 0.93rem;
  font-weight: 500;
  color: var(--text-primary);
}

.required {
  color: var(--error-color, #ef4444);
}

.error-message {
  font-size: 0.86rem;
  color: var(--destructive);
}

.items-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-primary);
}

.item-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.item-row > *:not(:last-child) {
  flex: 1;
}

.item-row > *:first-child {
  flex: 2;
}

.advanced-toggle {
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
  align-self: flex-start;
}

.advanced-toggle:hover {
  color: var(--accent);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.57rem;
}

.scan-block {
  display: flex;
  flex-direction: column;
  gap: 0.57rem;
}

.scan-block__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.57rem;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
}

.qr-camera__back {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;

  background: #00000080;

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

/* ================== Mobile ================== */

@media (max-width: 768px) {
  .receipt-form {
    min-width: 0;
    max-width: none;
    width: 100%;
  }

  .field-row {
    flex-direction: column;
  }
}
</style>
