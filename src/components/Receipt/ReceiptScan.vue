<template>
  <!-- ================== Сканирование QR ================== -->
  <div class="scan-actions">
    <ButtonUI
      type="muted"
      icon="fa-regular fa-image"
      :disabled="isScanningImage || isCheckingReceipt || cameraOpen"
      @click="qrFileInput.click()"
    >
      Сканировать по фото
    </ButtonUI>

    <ButtonUI
      type="muted"
      icon="fa-regular fa-camera"
      :disabled="isScanningImage || isCheckingReceipt || cameraOpen"
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
       сканирования, превью фото или разобранный чек. -->
  <div v-if="hasScanContent" class="scan-page">
    <div class="scan-block">
      <div v-if="isScanningImage" class="scan-block__status">
        <i class="fa-regular fa-spinner fa-spin"></i>
        Получаем данные чека...
      </div>

      <div v-if="isCheckingReceipt" class="scan-block__status">
        <i class="fa-regular fa-spinner fa-spin"></i>
        Получаем данные чека...
      </div>

      <div v-if="scannedPhotoUrl" class="scan-block__photo">
        <img :src="scannedPhotoUrl" alt="Скан чека" />

        <div class="scan-block__photo-info">
          <label class="checkbox-label">
            <input type="checkbox" v-model="attachScannedPhoto" />
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

    <!-- ================== Результат сканирования ================== -->
    <div v-if="receiptData" class="receipt-result">
      <div class="receipt-result__header">
        <h3>Данные чека</h3>

        <button
          type="button"
          class="receipt-result__clear"
          @click="resetReceipt"
          v-tooltip="'Очистить результат'"
        >
          <i class="fa-regular fa-xmark"></i>
        </button>
      </div>

      <div class="receipt-result__summary">
        <div v-if="receiptSummary.place" class="receipt-result__row">
          <span class="receipt-result__label">Место расчётов</span>
          <span>{{ receiptSummary.place }}</span>
        </div>

        <div v-if="receiptSummary.address" class="receipt-result__row">
          <span class="receipt-result__label">Адрес</span>
          <span>{{ receiptSummary.address }}</span>
        </div>

        <div v-if="receiptSummary.date" class="receipt-result__row">
          <span class="receipt-result__label">Дата и время</span>
          <span>{{ formatDate(receiptSummary.date) }}</span>
        </div>

        <div v-if="receiptSummary.operator" class="receipt-result__row">
          <span class="receipt-result__label">Кассир</span>
          <span>{{ receiptSummary.operator }}</span>
        </div>

        <div
          v-if="receiptSummary.fiscalDocumentNumber"
          class="receipt-result__row"
        >
          <span class="receipt-result__label">ФД</span>
          <span>{{ receiptSummary.fiscalDocumentNumber }}</span>
        </div>

        <div v-if="receiptSummary.fiscalSign" class="receipt-result__row">
          <span class="receipt-result__label">ФПД</span>
          <span>{{ receiptSummary.fiscalSign }}</span>
        </div>
      </div>

      <table v-if="receiptItems.length" class="receipt-result__items">
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
          <tr v-for="(item, index) in receiptItems" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ formatMoney(item.price) }}</td>
            <td>{{ formatMoney(item.sum) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="receipt-result__total">
        <span>Итого</span>
        <span>{{ formatMoney(receiptSummary.totalSum) }}</span>
      </div>

      <div class="receipt-result__footer">
        <div v-if="addError" class="receipt-result__error">
          {{ addError }}
        </div>

        <div class="receipt-result__actions">
          <ButtonUI type="muted" :disabled="isAdding" @click="resetReceipt">
            Отмена
          </ButtonUI>

          <ButtonUI type="accent" :disabled="isAdding" @click="addReceipt">
            <i v-if="isAdding" class="fa-regular fa-spinner fa-spin"></i>
            Добавить
          </ButtonUI>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'

import QrScanner from 'qr-scanner'
import QrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url'

import { nextTick, ref, computed, onBeforeUnmount } from 'vue'

import {
  checkReceiptByRaw,
  checkReceiptByImage,
  ReceiptCheckError,
} from '@/services/proverkacheka.api'
import { uploadReceiptFile } from '@/services/receipt.api'
import {
  mapExternalReceipt,
  parseExternalDate,
} from '@/utils/receiptCheck.utils'

import { useReceiptStore } from '@/stores/receipt'
import { useUserStore } from '@/stores/user'

QrScanner.WORKER_PATH = QrScannerWorkerPath

const receiptStore = useReceiptStore()
const userStore = useUserStore()

const qrFileInput = ref(null)
const qrVideo = ref(null)

let cameraScanner = null

const isScanningImage = ref(false)
const cameraOpen = ref(false)
const cameraError = ref('')

const scannedPhotoFile = ref(null)
const scannedPhotoUrl = ref('')
const attachScannedPhoto = ref(true)

const isCheckingReceipt = ref(false)

const receiptData = ref(null)
const isAdding = ref(false)
const addError = ref('')

// Карточка ниже (.scan-page) нужна, только пока есть что показать — иначе
// это пустой блок с рамкой до первого скана.
const hasScanContent = computed(
  () =>
    isScanningImage.value ||
    isCheckingReceipt.value ||
    !!scannedPhotoUrl.value ||
    !!receiptData.value
)

// Нормализация под показ — сырой ответ сервиса на разных чеках называет
// поля по-разному (см. комментарий у mapExternalReceipt в receiptCheck.utils.js),
// поэтому здесь тоже проверяем оба варианта, а не только документированный.
const receiptSummary = computed(() => {
  const data = receiptData.value
  if (!data) return {}

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
})
const receiptItems = computed(() => receiptSummary.value.items)

const formatDate = (date) => (date ? date.toLocaleString('ru-RU') : '')

const formatMoney = (value) => {
  if (value === undefined || value === null) {
    return '—'
  }

  return (Number(value) / 100).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  })
}

const resetReceipt = () => {
  receiptData.value = null
  addError.value = ''
}

// Общий обработчик успешного результата (что от камеры, что от фото)
const lastRawQr = ref(null)

const handleReceiptData = (data, extra = {}) => {
  receiptData.value = data
  lastRawQr.value = extra.raw ?? null
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

  isCheckingReceipt.value = true
  cameraError.value = ''

  try {
    const data = await checkReceiptByRaw(qrraw)

    handleReceiptData(data, { raw: qrraw })

    closeCameraScanner()
  } catch (error) {
    handleReceiptError(error)
  } finally {
    isCheckingReceipt.value = false
  }
}

/*
 * ============================================================
 * Сканирование по фото — файл целиком шлём на сторонний API
 * ============================================================
 */
const onQrFileSelected = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''

  if (!file || isCheckingReceipt.value) {
    return
  }

  clearScannedPhoto()

  scannedPhotoFile.value = file
  scannedPhotoUrl.value = URL.createObjectURL(file)

  isScanningImage.value = true

  try {
    const data = await checkReceiptByImage(file)

    handleReceiptData(data)
  } catch (error) {
    handleReceiptError(error)
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

// Добавление чека — маппинг ответа внешнего API уже сделан в receiptCheck.utils.js
const addReceipt = async () => {
  if (!receiptData.value || isAdding.value) {
    return
  }

  if (!userStore.user?.id) {
    addError.value = 'Не удалось определить текущего пользователя'
    return
  }

  isAdding.value = true
  addError.value = ''

  try {
    const payload = {
      userId: userStore.user.id,
      ...mapExternalReceipt(receiptData.value, lastRawQr.value),
    }

    const created = await receiptStore.addReceipt(payload)

    // Фото прикрепляем автоматически (чекбокс позволяет отказаться) — есть
    // только при скане по фото, у камеры своего файла нет.
    if (attachScannedPhoto.value && scannedPhotoFile.value) {
      try {
        await uploadReceiptFile(created.id, scannedPhotoFile.value)
      } catch (error) {
        console.error('Чек создан, но не удалось прикрепить фото:', error)
      }
    }

    resetReceipt()
    clearScannedPhoto()
  } catch (error) {
    console.error('Не удалось добавить чек:', error)
    addError.value = error?.message || 'Не удалось добавить чек'
  } finally {
    isAdding.value = false
  }
}

onBeforeUnmount(() => {
  closeCameraScanner()
  clearScannedPhoto()
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

/* ================== Receipt result ================== */
/* Не отдельная карточка (было бы "рамка в рамке" внутри .scan-page) — а
   секция страницы, отделённая линией сверху, как .receipt-list__controls
   отделяет шапку списка от таблицы. */

.receipt-result {
  display: flex;
  flex-direction: column;
  gap: 0.86rem;

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
</style>
