<template>
  <div class="receipt-paper" ref="paperRef">
    <div class="receipt-paper__zigzag receipt-paper__zigzag--top"></div>

    <div class="receipt-paper__body">
      <div class="receipt-paper__brand">
        <div class="receipt-paper__brand-name">Кассовый чек</div>
        <div class="receipt-paper__brand-sub">{{ operationTypeLabel }}</div>
        <div class="receipt-paper__seller" v-if="sellerName">
          {{ sellerName }}
        </div>
      </div>

      <div class="receipt-paper__divider"></div>

      <div class="receipt-paper__items" ref="itemsRef">
        <div class="receipt-paper__items-head">
          <span class="col-name">Предмет расчёта</span>
          <span class="col-price">Цена, ₽</span>
          <span class="col-qty">Кол-во</span>
          <span class="col-sum">Сумма, ₽</span>
        </div>
        <div
          class="receipt-paper__item"
          v-for="(item, index) in receipt.items"
          :key="item.id"
        >
          <div class="receipt-paper__item-row">
            <span class="col-name">{{ index + 1 }}. {{ item.name }}</span>
            <span class="col-price">{{ formatMoneyPlain(item.price) }}</span>
            <span class="col-qty">{{ formatQuantity(item.quantity) }}</span>
            <span class="col-sum">{{ formatMoneyPlain(item.sum) }}</span>
          </div>
          <div class="receipt-paper__item-nds" v-if="getItemNdsLabel(item)">
            НДС {{ getItemNdsLabel(item) }}
          </div>
        </div>
      </div>

      <div class="receipt-paper__divider"></div>

      <div class="receipt-paper__total">
        <span>Итого</span>
        <span>{{ formatMoneyPlain(receipt.totalSum) }}</span>
      </div>

      <div
        class="receipt-paper__row"
        v-for="row in paymentRows"
        :key="row.label"
      >
        <span>{{ row.label }}</span>
        <span>{{ row.value }}</span>
      </div>
      <div class="receipt-paper__row" v-for="row in ndsRows" :key="row.label">
        <span>{{ row.label }}</span>
        <span>{{ row.value }}</span>
      </div>

      <div class="receipt-paper__divider"></div>

      <div class="receipt-paper__row">
        <span>ИНН</span>
        <span>{{ receipt.sellerInn }}</span>
      </div>
      <div class="receipt-paper__row" v-if="requestNumber">
        <span>Чек №</span>
        <span>{{ requestNumber }}</span>
      </div>
      <div class="receipt-paper__row" v-if="shiftNumber">
        <span>№ смены</span>
        <span>{{ shiftNumber }}</span>
      </div>
      <div class="receipt-paper__row" v-if="machineNumber">
        <span>№ АВТ</span>
        <span>{{ machineNumber }}</span>
      </div>
      <div class="receipt-paper__row" v-if="taxationLabel">
        <span>СНО</span>
        <span>{{ taxationLabel }}</span>
      </div>

      <div class="receipt-paper__divider"></div>

      <div class="receipt-paper__row">
        <span>Дата/Время</span>
        <span>{{ dateTimeLabel }}</span>
      </div>
      <div class="receipt-paper__row">
        <span>ФД №</span>
        <span>{{ receipt.fiscalDocumentNumber }}</span>
      </div>
      <div class="receipt-paper__row" v-if="fiscalDocumentFormatVer">
        <span>Версия ФФД</span>
        <span>{{ fiscalDocumentFormatVer }}</span>
      </div>
      <div class="receipt-paper__row">
        <span>ФН</span>
        <span>{{ receipt.fiscalDriveNumber }}</span>
      </div>
      <div class="receipt-paper__row" v-if="kktRegId">
        <span>РН ККТ</span>
        <span>{{ kktRegId }}</span>
      </div>
      <div class="receipt-paper__row">
        <span>ФП</span>
        <span>{{ receipt.fiscalSign }}</span>
      </div>

      <template v-if="operator || retailPlace || address">
        <div class="receipt-paper__divider"></div>

        <div class="receipt-paper__row" v-if="operator">
          <span>Кассир</span>
          <span class="receipt-paper__row-value--wrap">{{ operator }}</span>
        </div>
        <div class="receipt-paper__row" v-if="retailPlace">
          <span>Место расчётов</span>
          <span class="receipt-paper__row-value--wrap">{{ retailPlace }}</span>
        </div>
        <div class="receipt-paper__row" v-if="address">
          <span>Адрес расчётов</span>
          <span class="receipt-paper__row-value--wrap">{{ address }}</span>
        </div>
      </template>

      <div class="receipt-paper__divider"></div>

      <div class="receipt-paper__qr">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR-код чека" />
      </div>
    </div>

    <div class="receipt-paper__zigzag receipt-paper__zigzag--bottom"></div>
  </div>
</template>

<script setup>
import { parseDate } from '@/utils/date.utils'
import {
  getNdsRateLabel,
  getOperationTypeLabel,
  getTaxationTypeLabel,
  nullInt,
  nullString,
} from '@/utils/receipt.utils'
import QRCode from 'qrcode'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  receipt: { type: Object, required: true },
})

const paperRef = ref(null)
const itemsRef = ref(null)

defineExpose({ paperRef, itemsRef })

const operationTypeLabel = computed(() =>
  getOperationTypeLabel(props.receipt.operationType).toUpperCase()
)

const sellerName = computed(() => nullString(props.receipt.sellerName))

const address = computed(() => nullString(props.receipt.retailPlaceAddress))

const requestNumber = computed(() => nullString(props.receipt.requestNumber))
const shiftNumber = computed(() => nullInt(props.receipt.shiftNumber))
const machineNumber = computed(() => nullString(props.receipt.machineNumber))
const kktRegId = computed(() => nullString(props.receipt.kktRegId))
const fiscalDocumentFormatVer = computed(() =>
  nullInt(props.receipt.fiscalDocumentFormatVer)
)
const operator = computed(() => nullString(props.receipt.operator))
const retailPlace = computed(() => nullString(props.receipt.retailPlace))

const taxationLabel = computed(() =>
  getTaxationTypeLabel(nullInt(props.receipt.taxationType))
)

function getItemNdsLabel(item) {
  return getNdsRateLabel(nullInt(item.ndsCode))
}

const dateTimeLabel = computed(() => {
  const date = parseDate(props.receipt.ticketDate)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
})

const paymentRows = computed(() => {
  const rows = []
  const cash = nullInt(props.receipt.cashTotalSum)
  const ecash = nullInt(props.receipt.ecashTotalSum)
  const prepaid = nullInt(props.receipt.prepaidSum)
  if (cash != null)
    rows.push({ label: 'Наличные', value: formatMoneyPlain(cash) })
  if (ecash != null)
    rows.push({ label: 'Безналичные', value: formatMoneyPlain(ecash) })
  if (prepaid != null)
    rows.push({ label: 'Предоплата (аванс)', value: formatMoneyPlain(prepaid) })
  return rows
})

const ndsRows = computed(() => {
  const rows = []
  const r = props.receipt
  if (r.nds20)
    rows.push({ label: 'НДС со ставкой 20%', value: formatMoneyPlain(r.nds20) })
  if (r.nds22)
    rows.push({ label: 'НДС со ставкой 22%', value: formatMoneyPlain(r.nds22) })
  if (r.nds10)
    rows.push({ label: 'НДС со ставкой 10%', value: formatMoneyPlain(r.nds10) })
  if (r.nds0)
    rows.push({ label: 'НДС со ставкой 0%', value: formatMoneyPlain(r.nds0) })
  if (r.ndsNo) rows.push({ label: 'Без НДС', value: formatMoneyPlain(r.ndsNo) })
  return rows
})

function formatQuantity(value) {
  const n = Number(value)
  return Number.isInteger(n) ? String(n) : n.toString()
}

// Цена/сумма в таблице позиций — без "₽" в каждой строке, знак указан один
// раз в шапке колонки (как на стандартном кассовом чеке)
function formatMoneyPlain(kopecks) {
  if (kopecks == null) return '—'
  return (kopecks / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Реальный ФНС-формат QR кассового чека (t/s/fn/i/fp/n) — тот же, что
// печатается на бумажном чеке; используем исходную qr-строку со сканирования,
// если она сохранена, иначе восстанавливаем по фискальным реквизитам чека.
function buildQrPayload(receipt) {
  const raw = nullString(receipt.rawQr)
  if (raw) return raw

  const date = parseDate(receipt.ticketDate)
  const pad = (n) => String(n).padStart(2, '0')
  const t = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`
  const s = (receipt.totalSum / 100).toFixed(2)

  return `t=${t}&s=${s}&fn=${receipt.fiscalDriveNumber}&i=${receipt.fiscalDocumentNumber}&fp=${receipt.fiscalSign}&n=${receipt.operationType}`
}

const qrDataUrl = ref('')

watch(
  () => props.receipt,
  async (receipt) => {
    if (!receipt) {
      qrDataUrl.value = ''
      return
    }
    try {
      qrDataUrl.value = await QRCode.toDataURL(buildQrPayload(receipt), {
        margin: 1,
        width: 168,
        color: { dark: '#33302a', light: '#00000000' },
      })
    } catch {
      qrDataUrl.value = ''
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* «Термобумага» — сознательно не привязана к --foreground/тёмной теме:
   бумажный чек должен выглядеть одинаково в любой теме приложения */
.receipt-paper {
  --paper: #fdfcf8;
  --paper-line: rgba(40, 35, 25, 0.16);
  --paper-text: #33302a;
  --paper-muted: #837c6d;

  width: 100%;
  max-width: 28.75rem;
  margin: 0 auto;
  filter: drop-shadow(0 12px 28px rgba(20, 20, 30, 0.12));
  animation: receipt-paper-in 0.45s ease both;
}

@keyframes receipt-paper-in {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.receipt-paper__body {
  background: var(--paper);
  color: var(--paper-text);
  padding: 1.5rem;
  font-family: 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.86rem;
  line-height: 1.5;
}

.receipt-paper__zigzag {
  height: 0.86rem;
  background-image:
    linear-gradient(-45deg, var(--paper) 0.6rem, transparent 0),
    linear-gradient(45deg, var(--paper) 0.6rem, transparent 0);
  background-size: 1.15rem 1.15rem;
  background-position: left top;
  background-repeat: repeat-x;
}

.receipt-paper__zigzag--bottom {
  transform: rotate(180deg);
}

.receipt-paper__brand {
  text-align: center;
}

.receipt-paper__brand-name {
  /* em, не rem — должно масштабироваться вместе с font-size чека
     (уменьшается для печати, см. @media print ниже) */
  font-size: 1.57em;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.receipt-paper__brand-sub {
  color: var(--paper-muted);
  margin-top: 0.15rem;
}

.receipt-paper__seller {
  font-weight: 600;
  margin-top: 0.36rem;
}

.receipt-paper__label {
  font-weight: 600;
  font-size: 0.91em;
  color: var(--paper-muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 0.5rem;
}

.receipt-paper__divider {
  border-top: 0.07rem dashed var(--paper-line);
  margin: 0.86rem 0;
}

.receipt-paper__row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.receipt-paper__row + .receipt-paper__row {
  margin-top: 0.15rem;
}

.receipt-paper__row-value--wrap {
  text-align: right;
  max-width: 65%;
}

.receipt-paper__flash {
  color: var(--accent, #0060e5);
  transition: color 0.2s ease;
}

.receipt-paper__items-head,
.receipt-paper__item-row {
  display: grid;
  grid-template-columns: 1fr 4.3rem 3.2rem 4.6rem;
  gap: 0.5rem;
}

.receipt-paper__items-head {
  color: var(--paper-muted);
  font-size: 0.91em;
  padding-bottom: 0.36rem;
  border-bottom: 0.07rem dashed var(--paper-line);
  margin-bottom: 0.5rem;
}

.receipt-paper__item + .receipt-paper__item {
  margin-top: 0.5rem;
}

.receipt-paper__item-nds {
  color: var(--paper-muted);
  font-size: 0.91em;
  margin-top: 0.15rem;
}

.receipt-paper__items .col-qty,
.receipt-paper__items .col-price,
.receipt-paper__items .col-sum {
  text-align: right;
  white-space: nowrap;
}

.receipt-paper__total {
  display: flex;
  justify-content: space-between;
  font-size: 1.33em;
  font-weight: 700;
}

.receipt-paper__qr {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
}

.receipt-paper__qr img {
  width: 10.5rem;
  height: 10.5rem;
}

@media (max-width: 768px) {
  .receipt-paper {
    max-width: 100%;
  }
}

@media print {
  .receipt-paper {
    /* НЕ 100% — иначе чек растягивается на всю ширину печатной страницы
       (A4). Ширина сильно меньше, чем на экране (28.75rem) — реальная
       кассовая лента узкая (~58мм) */
    filter: none;
    max-width: 220px;
    margin: 0;
    animation: none;
  }

  .receipt-paper__body {
    font-size: 0.5rem;
    padding: 0.6rem;
  }

  .receipt-paper__qr img {
    width: 5.5rem;
    height: 5.5rem;
  }

  .receipt-paper__items-head,
  .receipt-paper__item-row {
    grid-template-columns: 1fr 2.2rem 1.6rem 2.4rem;
    gap: 0.25rem;
  }
}
</style>
