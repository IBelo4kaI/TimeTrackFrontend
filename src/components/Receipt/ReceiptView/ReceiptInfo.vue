<template>
  <div class="info" v-if="isLoading">
    <LoaderTitle />
  </div>

  <div class="info" v-else-if="!receipt">
    <span class="info__empty">Чек не найден</span>
  </div>

  <div class="info" v-else>
    <div class="info__header">
      <div class="info__employee">
        <div class="info__profile">{{ initials }}</div>
        <div class="info__employee-column">
          <div class="info__employee-name">
            {{ nullString(receipt.sellerName) || 'Продавец не указан' }}
          </div>
          <div class="info__employee-sub" v-if="isAdmin">
            {{ employeeName }}
          </div>
        </div>
      </div>
      <div class="info__badges">
        <Badge type="muted">
          {{ getOperationTypeLabel(receipt.operationType) }}
        </Badge>
        <Badge v-if="taxationLabel" type="muted">{{ taxationLabel }}</Badge>
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

    <div class="info__block" v-if="nullString(receipt.retailPlaceAddress)">
      <div class="info__block-title">Адрес точки продаж</div>
      <div class="info__block-content">
        {{ nullString(receipt.retailPlaceAddress) }}
      </div>
    </div>

    <div class="info__block" v-if="paymentBreakdown.length">
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
    </div>

    <div class="info__block" v-if="ndsBreakdown.length">
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
    </div>

    <div class="info__block">
      <div class="info__block-title">Позиции</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Наименование</th>
            <th>Кол-во</th>
            <th>Цена</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in receipt.items" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ Number(item.quantity) }}</td>
            <td>{{ formatMoney(item.price) }}</td>
            <td>{{ formatMoney(item.sum) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="info__meta">
      <span>Добавлен: {{ new Date(receipt.createdAt).toLocaleString() }}</span>
      <span v-if="receipt.updatedAt">
        Обновлён: {{ new Date(receipt.updatedAt).toLocaleString() }}
      </span>
    </div>

    <div class="info__admin" v-if="canManage || canTransfer">
      <div class="info__admin-title">Управление чеком</div>

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
</template>

<script setup>
import Autocomplete from '@/components/Autocomplete.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import CardStatistics from '@/components/CardStatistics.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { transferReceipt } from '@/services/receipt.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useReceiptStore } from '@/stores/receipt'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { playSuccessSound } from '@/utils/sound.utils'
import {
  formatMoney,
  getOperationTypeLabel,
  getTaxationTypeLabel,
  nullInt,
  nullString,
} from '@/utils/receipt.utils'
import { computed, ref } from 'vue'
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

const isAdmin = computed(() => userStore.hasPermission('receipts.all', 'read'))

// зеркалит RequireOwnerOrAll на бэке: своим чеком можно управлять всегда,
// чужим — только с receipts.all:delete
const canManage = computed(() => {
  if (!props.receipt) return false
  if (props.receipt.userId === userStore.user?.id) return true
  return userStore.hasPermission('receipts.all', 'delete')
})

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

const initials = computed(() => {
  const name = nullString(props.receipt?.sellerName)
  return name ? name.charAt(0).toUpperCase() : '#'
})

const ticketDateLabel = computed(() => {
  if (!props.receipt) return ''
  const date = parseDate(props.receipt.ticketDate)
  return `${getDateNamed(date)} ${date.getFullYear()}`
})

const taxationLabel = computed(() =>
  props.receipt
    ? getTaxationTypeLabel(nullInt(props.receipt.taxationType))
    : null
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

.info__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--gap-primary);
  padding-bottom: var(--padding-secondary);
  border-bottom: 0.07rem solid var(--border-color);
}

.info__employee {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info__profile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 700;
  flex-shrink: 0;
}

.info__employee-column {
  display: flex;
  flex-direction: column;
}

.info__employee-name {
  font-size: 1.2rem;
  font-weight: 700;
}

.info__employee-sub {
  color: var(--muted-text);
  font-size: 0.9rem;
}

.info__badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.info__stats {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  flex-wrap: wrap;
}

.info__stats > * {
  flex: 1;
  min-width: 14rem;
}

.info__block-title {
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 700;
  margin-bottom: 0.36rem;
}

.info__block-content {
  white-space: pre-wrap;
}

.info__breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info__breakdown-row {
  display: flex;
  justify-content: space-between;
  max-width: 20rem;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  text-align: left;
  font-size: 0.85rem;
  color: var(--muted-text);
  font-weight: 600;
  padding: 0.36rem 0;
  border-bottom: 0.07rem solid var(--border-color);
}

.items-table td {
  padding: 0.5rem 0;
  border-bottom: 0.07rem solid var(--border-color);
}

.items-table th:not(:first-child),
.items-table td:not(:first-child) {
  text-align: right;
  padding-left: 1rem;
}

.info__meta {
  display: flex;
  gap: var(--gap-primary);
  flex-wrap: wrap;
  color: var(--muted-text);
  font-size: 0.85rem;
}

.info__admin {
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
  padding-top: var(--padding-secondary);
  border-top: 0.07rem solid var(--border-color);
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

.info__transfer {
  display: flex;
  align-items: flex-end;
  gap: var(--gap-primary);
  flex-wrap: wrap;
}

.info__transfer > :first-child {
  flex: 1;
  min-width: 14rem;
}

@media (max-width: 768px) {
  .info__transfer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
