<template>
  <div class="container">
    <div class="back-row">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>
    </div>

    <LoaderTitle v-if="isLoading" />
    <template v-else-if="card">
      <section class="block">
        <div class="head">
          <h3>
            Карта •••• {{ card.last4 }}
            <span v-if="card.label">· {{ card.label }}</span>
          </h3>
          <div class="head__actions">
            <ButtonUI
              v-if="isAdmin"
              type="muted"
              :icon="fullNumber ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"
              v-tooltip="fullNumber ? 'Скрыть номер' : 'Показать номер'"
              @click="toggleNumber"
            />
            <template v-if="canEdit">
              <ButtonUI
                type="muted"
                icon="fa-regular fa-user-plus"
                v-tooltip="'Выдать сотруднику'"
                @click="openAssignModal(card, onCardChanged)"
              />
              <ButtonUI
                type="muted"
                icon="fa-regular fa-pen"
                v-tooltip="'Редактировать'"
                @click="openEditModal(card, onCardChanged)"
              />
            </template>
            <ButtonUI
              v-if="canDelete"
              type="destructive"
              icon="fa-regular fa-trash-can-xmark"
              v-tooltip="'Удалить карту'"
              @click="confirmDelete(card, goToList)"
            />
            <ButtonUI
              v-if="canEdit && card.ownerId"
              type="muted"
              icon="fa-regular fa-user-minus"
              v-tooltip="'Снять с сотрудника'"
              @click="onRelease"
            />
          </div>
        </div>

        <div v-if="fullNumber" class="number">{{ fullNumber }}</div>

        <dl class="info">
          <div>
            <dt>Статус</dt>
            <dd>
              <Badge :type="card.status == 'active' ? 'success' : 'destruct'">
                {{ card.status == 'active' ? 'Активна' : 'Заблокирована' }}
              </Badge>
            </dd>
          </div>
          <div>
            <dt>Владелец</dt>
            <dd>{{ card.ownerId ? userName(card.ownerId) : 'Не выдана' }}</dd>
          </div>
          <div>
            <dt>Банк</dt>
            <dd>{{ card.bank || '—' }}</dd>
          </div>
          <div>
            <dt>Держатель</dt>
            <dd>{{ card.holderName || '—' }}</dd>
          </div>
          <div>
            <dt>Срок действия</dt>
            <dd>{{ card.expiry || '—' }}</dd>
          </div>
          <div>
            <dt>Лимит</dt>
            <dd>{{ card.cardLimit != null ? formatMoney(card.cardLimit) : '—' }}</dd>
          </div>
        </dl>
      </section>

      <section class="block">
        <div class="spend">
          <div>
            Потрачено:
            <b>{{ formatMoney(spendTotal) }}</b>
            <template v-if="card.cardLimit != null">
              из {{ formatMoney(card.cardLimit) }}
            </template>
          </div>
          <MonthYearSelect
            align="left"
            v-model:month="month"
            v-model:year="year"
          />
        </div>

        <div v-if="categoryBreakdown.length" class="categories">
          <Badge v-for="c in categoryBreakdown" :key="c.label" type="muted">
            {{ c.label }}: {{ formatMoney(c.sum) }}
          </Badge>
        </div>

        <AppTable
          :headers="receiptHeaders"
          :rows="receiptRows"
          row-key="id"
          empty-text="Чеков по карте за период нет"
        >
          <template #cell-totalSum="{ value }">
            <Badge type="muted">{{ formatMoney(value) }}</Badge>
          </template>
          <template #actions="{ row }">
            <ButtonUI
              type="muted-accent"
              icon="fa-regular fa-arrow-up-right-from-square"
              v-tooltip="'Открыть чек'"
              @click="router.push({ name: 'receipt-view', params: { id: row.id } })"
            />
          </template>
        </AppTable>
      </section>

      <section v-if="isAdmin && history.length" class="block">
        <h4>История выдачи</h4>
        <ul class="history">
          <li v-for="h in history" :key="h.id">
            {{ userName(h.userId) }} — с {{ formatDate(h.assignedAt) }}
            <template v-if="h.releasedAt">
              по {{ formatDate(h.releasedAt) }}
            </template>
            <template v-else>(сейчас)</template>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import MonthYearSelect from '@/components/MonthYearSelect.vue'
import {
  getBusinessCardById,
  getBusinessCardHistory,
  getBusinessCardNumber,
  getReceiptsByBusinessCard,
  releaseBusinessCard,
} from '@/services/businessCard.api'
import {
  getUserFullName as userName,
  useBusinessCardActions,
} from '@/helpers/businessCard.helpers'
import { useBusinessCardStore } from '@/stores/businessCard'
import { useConfirmModal } from '@/stores/confirmModal'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useNotificationStore } from '@/stores/notification'
import { useReceiptStore } from '@/stores/receipt'
import { useUserStore } from '@/stores/user'
import { parseDate } from '@/utils/date.utils'
import { formatMoney, nullString } from '@/utils/receipt.utils'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const receiptStore = useReceiptStore()
const businessCardStore = useBusinessCardStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()

useHeaderTitleStore().setTitle('Карта', 'Корпоративная карта и траты по ней')

const isAdmin = computed(() =>
  userStore.hasPermission('business_cards.all', 'read')
)
const canEdit = computed(() =>
  userStore.hasPermission('business_cards.all', 'edit')
)
const canDelete = computed(() =>
  userStore.hasPermission('business_cards.all', 'delete')
)

const card = ref(null)
const cardReceipts = ref([])
const history = ref([])
const fullNumber = ref('')
const isLoading = ref(true)
const month = ref(new Date().getMonth() + 1)
const year = ref(new Date().getFullYear())

const errorMessage = (err, fallback) => err?.message || fallback
const formatDate = (v) => (v ? parseDate(v).toLocaleDateString() : '—')

const { openEditModal, openAssignModal, confirmDelete } =
  useBusinessCardActions()

const goToList = () => {
  businessCardStore.returnToCards = true
  router.replace({ name: 'receipts' })
}

async function onCardChanged(updated) {
  card.value = updated
  fullNumber.value = ''
  if (isAdmin.value) history.value = await getBusinessCardHistory(updated.id)
}

function goBack() {
  if (window.history.state?.back) router.back()
  else goToList()
}

async function load() {
  const id = route.params.id
  try {
    const [c, list, hist] = await Promise.all([
      getBusinessCardById(id),
      getReceiptsByBusinessCard(id),
      isAdmin.value ? getBusinessCardHistory(id) : [],
    ])
    card.value = c
    cardReceipts.value = list ?? []
    history.value = hist ?? []
  } catch (err) {
    notificationStore.addNotification(
      errorMessage(err, 'Не удалось загрузить карту'),
      'error'
    )
    goToList()
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  receiptStore.fetchCategories()
  load()
})

async function toggleNumber() {
  if (fullNumber.value) {
    fullNumber.value = ''
    return
  }
  try {
    fullNumber.value = (await getBusinessCardNumber(card.value.id)).number
  } catch (err) {
    notificationStore.addNotification(
      errorMessage(err, 'Не удалось получить номер карты'),
      'error'
    )
  }
}

function onRelease() {
  confirmModalStore.open(async () => {
    try {
      card.value = await releaseBusinessCard(card.value.id)
      if (isAdmin.value) {
        history.value = await getBusinessCardHistory(card.value.id)
      }
    } catch (err) {
      notificationStore.addNotification(
        errorMessage(err, 'Не удалось снять карту'),
        'error'
      )
      return
    }
    notificationStore.addNotification('Карта снята с сотрудника', 'success')
  }, 'Снять карту с текущего сотрудника?')
}

// Период фильтруем на фронте по дате чека, как и в списке чеков
const periodReceipts = computed(() =>
  cardReceipts.value.filter((r) => {
    const d = new Date(r.ticketDate)
    if (d.getFullYear() != year.value) return false
    return !month.value || d.getMonth() + 1 == month.value
  })
)

const spendTotal = computed(() =>
  periodReceipts.value.reduce((sum, r) => sum + (r.totalSum ?? 0), 0)
)

const categoryBreakdown = computed(() => {
  const sums = new Map()
  for (const r of periodReceipts.value) {
    const ids = r.categoryIds?.length ? r.categoryIds : [null]
    for (const id of ids) {
      const label =
        id == null ? 'Без категории' : receiptStore.getCategoryLabel(id)
      if (label) sums.set(label, (sums.get(label) ?? 0) + (r.totalSum ?? 0))
    }
  }
  return [...sums.entries()]
    .map(([label, sum]) => ({ label, sum }))
    .sort((a, b) => b.sum - a.sum)
})

const receiptHeaders = computed(() => {
  const cols = [
    { valueKey: 'ticketDate', title: 'Дата чека', format: formatDate },
    { valueKey: 'sellerDisplay', title: 'Продавец' },
    { valueKey: 'totalSum', title: 'Сумма' },
  ]
  if (isAdmin.value) cols.splice(1, 0, { valueKey: 'userName', title: 'Сотрудник' })
  return cols
})

const receiptRows = computed(() =>
  periodReceipts.value.map((r) => ({
    ...r,
    sellerDisplay:
      nullString(r.sellerName) ||
      (nullString(r.sellerInn) ? `ИНН ${nullString(r.sellerInn)}` : 'Без продавца'),
    userName: userName(r.userId),
  }))
)
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  background: none;
  border: none;
  color: var(--muted-text);
  font: inherit;
  cursor: pointer;
}

.back-link:hover {
  color: var(--accent);
}

.block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.head,
.spend {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.head__actions {
  display: flex;
  gap: 0.25rem;
}

.number {
  font-family: monospace;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  user-select: all;
}

.info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.info dt {
  color: var(--muted-text);
  font-size: 0.85rem;
}

.info dd {
  margin: 0.15rem 0 0;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.history {
  margin: 0;
  padding-left: 1.25rem;
}
</style>
