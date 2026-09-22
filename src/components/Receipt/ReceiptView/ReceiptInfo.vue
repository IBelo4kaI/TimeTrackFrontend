<template>
  <div class="info" v-if="isLoading">
    <LoaderTitle />
  </div>

  <div class="info" v-else-if="!receipt">
    <span class="info__empty">Чек не найден</span>
  </div>

  <div class="info-layout" v-else>
    <ReceiptPaper ref="paperComponent" :receipt="receipt" />

    <div class="info__panel">
      <div class="info__panel-card-no-border">
        <div class="info__panel-header">
          <div class="info__panel-title-column">
            <div class="info__panel-title">
              <i class="fa-regular fa-receipt"></i>
              Информация о чеке
            </div>
            <div class="info__panel-employee" v-if="isAdmin && employeeName">
              {{ employeeName }}
            </div>
          </div>
          <div class="info__panel-badges">
            <Badge :type="receipt.hasPaper ? 'success' : 'muted'">
              {{ receipt.hasPaper ? 'Бумажный' : 'Электронный' }}
            </Badge>
            <Badge type="muted">{{ categoryLabel ?? 'Без категории' }}</Badge>
            <Badge type="success">Завершён</Badge>
          </div>
        </div>

        <div class="info__stats">
          <CardStatistics
            icon="fa-regular fa-calendar"
            iconVariant="primary"
            valueVariant="primary"
            label="Дата покупки"
            :value="ticketDateLabel"
          />
          <CardStatistics
            icon="fa-regular fa-sack-dollar"
            iconVariant="success"
            valueVariant="success"
            label="Сумма чека"
            :value="formatMoney(receipt.totalSum)"
          />
          <CardStatistics
            icon="fa-regular fa-building"
            iconVariant="primary"
            valueVariant="primary"
            label="ИНН продавца"
            :value="receipt.sellerInn"
          />
        </div>
      </div>

      <div class="info__panel-card-no-border" v-if="address">
        <div class="info__block-title">
          <i class="fa-regular fa-location-dot"></i>
          Адрес точки продаж
        </div>
        <div class="info__block-content">{{ address }}</div>
      </div>

      <div
        class="info__panel-card"
        v-if="paymentBreakdown.length || ndsBreakdown.length"
      >
        <template v-if="paymentBreakdown.length">
          <div class="info__block-title">Оплата</div>
          <div class="info__breakdown">
            <div
              v-for="row in paymentBreakdown"
              :key="row.label"
              class="info__breakdown-row"
            >
              <span>{{ row.label }}</span>
              <span>{{ row.value }}</span>
            </div>
          </div>
        </template>

        <template v-if="ndsBreakdown.length">
          <div class="info__panel-divider" v-if="paymentBreakdown.length"></div>
          <div class="info__block-title">НДС</div>
          <div class="info__breakdown">
            <div
              v-for="row in ndsBreakdown"
              :key="row.label"
              class="info__breakdown-row"
            >
              <span>{{ row.label }}</span>
              <span>{{ row.value }}</span>
            </div>
          </div>
        </template>
      </div>

      <button
        type="button"
        class="info__panel-card info__items-card"
        @click="scrollToItems"
      >
        <div class="info__panel-header">
          <div class="info__block-title">Позиции</div>
          <span class="info__items-count">{{ itemsCountLabel }}</span>
        </div>
        <div class="info__items-link">
          <span>Список товаров</span>
          <i class="fa-regular fa-chevron-right"></i>
        </div>
      </button>

      <div class="info__actions">
        <ButtonUI
          type="accent"
          icon="fa-regular fa-arrow-down-to-line"
          :disabled="isDownloading"
          @click="onDownload"
        >
          Скачать чек
        </ButtonUI>
        <ButtonUI
          v-if="isAdmin"
          type="muted"
          icon="fa-regular fa-print"
          @click="onPrint"
        >
          Печать
        </ButtonUI>
      </div>

      <div class="info__admin" v-if="canManage || canTransfer">
        <div class="info__admin-title">Управление чеком</div>

        <div class="info__category" v-if="canTransfer">
          <SelectUI
            v-model="categoryDraft"
            :options="receiptStore.categoryOptions"
            label="Категория"
            placeholder="Без категории"
          />
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-check"
            :disabled="!categoryChanged || isMutating"
            @click="onSaveCategory"
          >
            Сохранить
          </ButtonUI>
        </div>

        <div class="info__transfer" v-if="canTransfer">
          <Autocomplete
            v-model="transferUserId"
            :options="transferOptions"
            value-key="id"
            :label-key="['surname', 'name', 'patronymic']"
            label-separator=" "
            placeholder="Выберите сотрудника"
            :is-show-button="false"
          />
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-right-left"
            :disabled="!transferUserId || isMutating"
            @click="onTransfer"
          >
            Передать
          </ButtonUI>
        </div>

        <div class="info__admin-actions" v-if="canManage">
          <ButtonUI
            type="destructive"
            icon="fa-regular fa-trash-can-xmark"
            :disabled="isMutating"
            @click="onDelete"
          >
            Удалить чек
          </ButtonUI>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Autocomplete from '@/components/Autocomplete.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import CardStatistics from '@/components/CardStatistics.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import ReceiptPaper from '@/components/Receipt/ReceiptView/ReceiptPaper.vue'
import SelectUI from '@/components/SelectUI.vue'
import { setReceiptCategory, transferReceipt } from '@/services/receipt.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useReceiptStore } from '@/stores/receipt'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { playSuccessSound } from '@/utils/sound.utils'
import { formatMoney, nullInt, nullString } from '@/utils/receipt.utils'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  receipt: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
})

const userStore = useUserStore()
const receiptStore = useReceiptStore()
const notificationStore = useNotificationStore()
const confirmModalStore = useConfirmModal()
const router = useRouter()

onMounted(() => {
  receiptStore.fetchCategories()
})

const paperComponent = ref(null)

const isAdmin = computed(() => userStore.hasPermission('receipts.all', 'read'))

// зеркалит RequireOwnerOrAll на бэке: своим чеком можно управлять всегда,
// чужим — только с receipts.all:delete
const canManage = computed(() => {
  if (!props.receipt) return false
  if (props.receipt.userId === userStore.user?.id) return true
  return userStore.hasPermission('receipts.all', 'delete')
})

const ticketDateLabel = computed(() => {
  if (!props.receipt) return ''
  const date = parseDate(props.receipt.ticketDate)
  return `${getDateNamed(date)} ${date.getFullYear()}`
})

const address = computed(() => nullString(props.receipt?.retailPlaceAddress))

const categoryLabel = computed(() =>
  receiptStore.getCategoryLabel(nullInt(props.receipt?.categoryId))
)

const paymentBreakdown = computed(() => {
  if (!props.receipt) return []
  const rows = []
  const cash = nullInt(props.receipt.cashTotalSum)
  const ecash = nullInt(props.receipt.ecashTotalSum)
  if (cash != null) rows.push({ label: 'Наличными', value: formatMoney(cash) })
  if (ecash != null)
    rows.push({ label: 'Безналичными', value: formatMoney(ecash) })
  return rows
})

const ndsBreakdown = computed(() => {
  if (!props.receipt) return []
  const rows = []
  if (props.receipt.nds20)
    rows.push({ label: 'НДС 20%', value: formatMoney(props.receipt.nds20) })
  if (props.receipt.nds10)
    rows.push({ label: 'НДС 10%', value: formatMoney(props.receipt.nds10) })
  if (props.receipt.nds0)
    rows.push({ label: 'НДС 0%', value: formatMoney(props.receipt.nds0) })
  if (props.receipt.ndsNo)
    rows.push({ label: 'Без НДС', value: formatMoney(props.receipt.ndsNo) })
  return rows
})

// Родительный падеж множественного числа ("5 позиций") — стандартный для
// счётчиков в интерфейсе, с корректным склонением на 1/2-4/5+.
function pluralize(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

const itemsCountLabel = computed(() => {
  const count = props.receipt?.items?.length ?? 0
  return `${count} ${pluralize(count, 'позиция', 'позиции', 'позиций')}`
})

function scrollToItems() {
  const el = paperComponent.value?.itemsRef
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('receipt-paper__flash')
  setTimeout(() => el.classList.remove('receipt-paper__flash'), 900)
}

const isDownloading = ref(false)

async function onDownload() {
  const node = paperComponent.value?.paperRef
  if (!node || isDownloading.value) return

  isDownloading.value = true
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(node, { backgroundColor: null, scale: 2 })
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    )
    if (!blob) throw new Error('empty blob')

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chek-${props.receipt.id}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch {
    notificationStore.addNotification(
      'Не удалось сформировать файл чека',
      'error'
    )
  } finally {
    isDownloading.value = false
  }
}

function onPrint() {
  // Отдельная безchrome-страница печати (см. router/index.js, Print.vue) —
  // открываем в новой вкладке, чтобы не терять текущую страницу чека.
  const url = router.resolve({
    name: 'print',
    params: { type: 'receipt' },
    query: { ids: props.receipt.id },
  }).href
  window.open(url, '_blank')
}

const employee = computed(() =>
  props.receipt
    ? userStore.usersAll.find((u) => u.id === props.receipt.userId)
    : null
)

const employeeName = computed(() => {
  const e = employee.value
  if (!e) return ''
  return [e.surname, e.name, e.patronymic].filter(Boolean).join(' ')
})

// Зеркалит RequireOwnerOrAll на бэке (internal/receipt/handler.go,
// TransferReceipt): свой чек можно передать при базовом receipts:edit,
// чужой — только с receipts.all:edit.
const canTransfer = computed(() => {
  if (!props.receipt) return false
  if (props.receipt.userId === userStore.user?.id) return true
  return userStore.hasPermission('receipts.all', 'edit')
})

const transferUserId = ref(null)

// Текущего владельца из списка убираем — "передать" ему же бессмысленно
// (бэк и так это отклонит, см. ErrSameOwner).
const transferOptions = computed(() =>
  userStore.usersAll.filter((u) => u.id !== props.receipt?.userId)
)

const isMutating = ref(false)

// Черновик категории до "Сохранить" — та же схема, что у transferUserId
// выше (пишем в receipt.categoryId только по явному сохранению).
const categoryDraft = ref('')
watch(
  () => props.receipt,
  (receipt) => {
    categoryDraft.value = nullInt(receipt?.categoryId) ?? ''
  },
  { immediate: true }
)

const categoryChanged = computed(
  () => categoryDraft.value !== (nullInt(props.receipt?.categoryId) ?? '')
)

async function onSaveCategory() {
  isMutating.value = true
  try {
    const updated = await setReceiptCategory(
      props.receipt.id,
      categoryDraft.value || null
    )
    props.receipt.categoryId = updated.categoryId
    notificationStore.addNotification('Категория обновлена', 'success')
  } catch {
    notificationStore.addNotification(
      'Не удалось обновить категорию чека',
      'error'
    )
  } finally {
    isMutating.value = false
  }
}

async function onTransfer() {
  if (!transferUserId.value) return

  isMutating.value = true
  try {
    await transferReceipt(props.receipt.id, transferUserId.value)
    playSuccessSound()
    notificationStore.addNotification('Чек передан сотруднику', 'success')
    transferUserId.value = null
    // Чек больше не принадлежит текущему сотруднику — как и после удаления
    // (onDelete ниже), уходим со страницы, а не просто обновляем её.
    router.push({ name: 'receipts' })
  } catch (error) {
    notificationStore.addNotification(
      error?.message || 'Не удалось передать чек',
      'error'
    )
  } finally {
    isMutating.value = false
  }
}

async function onDelete() {
  confirmModalStore.open(async () => {
    isMutating.value = true
    try {
      await receiptStore.removeReceipt(props.receipt.id)
      notificationStore.addNotification('Чек удалён', 'success')
      router.push({ name: 'receipts' })
    } catch {
      notificationStore.addNotification('Ошибка при удалении чека', 'error')
    } finally {
      isMutating.value = false
    }
  }, 'Вы действительно хотите удалить чек?')
}
</script>

<style scoped>
.info {
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  padding: var(--padding-secondary);
}

.info__empty {
  color: var(--muted-text);
}

.info-layout {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 5.7rem;
}

.info__panel {
  flex: 1;
  max-width: 30rem;
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  padding: var(--padding-secondary);
  animation: info-panel-in 0.5s ease 0.15s both;
}

@keyframes info-panel-in {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info__panel-card {
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  padding: var(--padding-secondary);
}

.info__panel-card-no-border {
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
}

.info__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-primary);
}

.info__panel-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.info__panel-title-column {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.info__panel-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.info__panel-title i {
  color: var(--accent);
}

.info__panel-employee {
  font-size: 0.85rem;
  color: var(--muted-text);
}

.info__stats {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}

.info__block-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 700;
}

.info__block-content {
  white-space: pre-wrap;
}

.info__panel-divider {
  border-top: 0.07rem solid var(--border-color);
  margin: -0.14rem 0;
}

.info__breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
}

.info__breakdown-row {
  display: flex;
  justify-content: space-between;
}

.info__items-card {
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: border-color 0.15s;
}

.info__items-card:hover {
  border-color: var(--accent);
}

.info__items-count {
  font-size: 0.85rem;
  color: var(--muted-text);
}

.info__items-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.71rem var(--padding-secondary);
  background: var(--muted-foreground);
  border-radius: calc(var(--border-radius) * 0.6);
  font-weight: 500;
}

.info__actions {
  display: flex;
  gap: var(--gap-primary);
}

.info__actions > * {
  flex: 1;
  justify-content: center;
}

.info__admin {
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  padding: var(--padding-secondary);
}

.info__admin-title {
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 700;
}

.info__admin-actions {
  display: flex;
  gap: var(--gap-primary);
  flex-wrap: wrap;
}

.info__category,
.info__transfer {
  display: flex;
  align-items: flex-end;
  gap: var(--gap-primary);
  flex-wrap: wrap;
}

.info__category > :first-child,
.info__transfer > :first-child {
  flex: 1;
  min-width: 14rem;
}

@media (max-width: 1100px) {
  .info-layout {
    flex-direction: column;
    align-items: stretch;
    gap: var(--padding-primary);
  }

  .info__panel {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .info__category,
  .info__transfer {
    flex-direction: column;
    align-items: stretch;
  }

  .info__actions {
    flex-direction: column;
  }
}
</style>
