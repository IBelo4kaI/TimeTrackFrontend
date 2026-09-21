<template>
  <div class="receipt-list">
    <AppTable
      :headers="headers"
      :rows="rows"
      row-key="id"
      :loading="receiptStore.isLoading"
      empty-text="Чеки не найдены"
      :selectable="isAdmin"
      v-model:selected-rows="selectedIds"
    >
      <template #toolbar>
        <template v-if="isAdmin">
          <Tabs
            :tabs="targets"
            v-model="receiptStore.target"
            type="line"
            class="target-tabs"
          />
        </template>

        <template v-if="!isMobile">
          <MonthYearSelect
            align="center"
            v-model:month="receiptStore.selectedMonth"
            v-model:year="receiptStore.selectedYear"
          />
          <SelectUI
            label=""
            align="center"
            :options="sortOptions"
            v-model="receiptStore.sortBy"
          />
          <Autocomplete
            v-if="receiptStore.target == 'all'"
            v-model="receiptStore.employeeId"
            :options="employeeOptions"
            label-key="label"
            value-key="value"
            :is-show-button="false"
            placeholder="Все сотрудники"
            empty-text="Сотрудник не найден"
            class="filters-employee"
          />
        </template>

        <button
          v-else
          type="button"
          class="filter-trigger"
          @click="filtersOpen = true"
          aria-label="Фильтры"
        >
          <i class="fa-regular fa-filter"></i>
        </button>

        <div class="receipt-list__end">
          <div class="receipt-list__total" v-if="!isMobile">
            Итого:
            <b>{{ formatMoney(receiptStore.totalSum) }}</b>
          </div>

          <ButtonUI
            v-if="isAdmin"
            type="muted"
            icon="fa-regular fa-print"
            :disabled="!selectedIds.length"
            @click="onPrintSelected"
          >
            Печать{{ selectedIds.length ? ` (${selectedIds.length})` : '' }}
          </ButtonUI>

          <ButtonUI
            type="accent"
            icon="fa-regular fa-plus"
            @click="router.push({ name: 'receipt-create' })"
          >
            Добавить
          </ButtonUI>
        </div>
      </template>

      <template #cell-operationType="{ value, row }">
        <Badge
          type="muted"
          class="operation-type-badge"
          v-tooltip="'Открыть чек'"
          @click="onOpen(row)"
        >
          {{ getOperationTypeLabel(value) }}
        </Badge>
      </template>

      <template #cell-totalSum="{ value }">
        <Badge type="muted">{{ formatMoney(value) }}</Badge>
      </template>

      <template #cell-hasPaper="{ value }">
        <Badge :type="value ? 'success' : 'muted'">
          {{ value ? 'Бумажный' : 'Электронный' }}
        </Badge>
      </template>

      <template #actions="{ row }">
        <div class="row-actions">
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-arrow-up-right-from-square"
            v-tooltip="'Открыть чек'"
            @click="onOpen(row)"
          />
          <template v-if="canManageRow(row)">
            <ButtonUI
              type="muted-accent"
              icon="fa-regular fa-file-import"
              v-tooltip="'Прикрепить фото/скан чека'"
              @click="triggerFileInput(row.id)"
            />
            <input
              :ref="(el) => setFileInputRef(row.id, el)"
              type="file"
              accept="image/*,.pdf"
              style="display: none"
              @change="(e) => onFileSelected(row.id, e)"
            />
            <ButtonUI
              type="destructive"
              icon="fa-regular fa-trash-can-xmark"
              v-tooltip="'Удалить чек'"
              @click="onDelete(row)"
            />
          </template>
        </div>
      </template>
    </AppTable>

    <MobileFilterDrawer v-model="filtersOpen">
      <MonthYearSelect
        label="Месяц и год"
        full-width
        v-model:month="receiptStore.selectedMonth"
        v-model:year="receiptStore.selectedYear"
      />
      <SelectUI
        label="Сортировка"
        full-width
        :options="sortOptions"
        v-model="receiptStore.sortBy"
      />
      <Autocomplete
        v-if="receiptStore.target == 'all'"
        v-model="receiptStore.employeeId"
        :options="employeeOptions"
        label-key="label"
        value-key="value"
        :is-show-button="false"
        label="Сотрудник"
        placeholder="Все сотрудники"
        empty-text="Сотрудник не найден"
      />
    </MobileFilterDrawer>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Autocomplete from '@/components/Autocomplete.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import MobileFilterDrawer from '@/components/MobileFilterDrawer.vue'
import MonthYearSelect from '@/components/MonthYearSelect.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { uploadReceiptFile } from '@/services/receipt.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useReceiptStore } from '@/stores/receipt'
import { useThemeStore } from '@/stores/themes.js'
import { useUserStore } from '@/stores/user.js'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import {
  formatMoney,
  getOperationTypeLabel,
  nullString,
} from '@/utils/receipt.utils'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const receiptStore = useReceiptStore()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const confirmModalStore = useConfirmModal()
const router = useRouter()
const { isMobile } = storeToRefs(useThemeStore())

const filtersOpen = ref(false)

const selectedIds = ref([])

// Выбор завязан на конкретный набор строк (id) — при смене вкладки
// "Мои чеки"/"Все чеки" или фильтра список строк меняется целиком, старый
// выбор теряет смысл
watch(
  () => [
    receiptStore.target,
    receiptStore.selectedMonth,
    receiptStore.selectedYear,
    receiptStore.employeeId,
  ],
  () => {
    selectedIds.value = []
  }
)

function onPrintSelected() {
  if (!selectedIds.value.length) return
  const url = router.resolve({
    name: 'print',
    params: { type: 'receipt' },
    query: { ids: selectedIds.value.join(',') },
  }).href
  window.open(url, '_blank')
}

// как у vacation.all:read (см. комментарий в VacationList.vue) — вкладка
// "Все чеки" для бухгалтерии/руководителей
const isAdmin = computed(() => userStore.hasPermission('receipts.all', 'read'))

const targets = [
  { id: 'my', label: 'Мои чеки' },
  { id: 'all', label: 'Все чеки' },
]

const sortOptions = [
  { label: 'По дате добавления', value: 'createdAt' },
  { label: 'По дате чека', value: 'ticketDate' },
]

const headers = computed(() => {
  const cols = [{ valueKey: 'operationType', title: 'Тип' }]
  if (receiptStore.target == 'all') {
    cols.push({ valueKey: 'userName', title: 'Сотрудник' })
  }
  cols.push(
    { valueKey: 'sellerDisplay', title: 'Продавец' },
    {
      valueKey: 'ticketDate',
      title: 'Дата чека',
      format: (v) =>
        v ? `${getDateNamed(parseDate(v))} ${parseDate(v).getFullYear()}` : '—',
    },
    { valueKey: 'totalSum', title: 'Сумма' },
    { valueKey: 'hasPaper', title: 'Экземпляр' },
    {
      valueKey: 'createdAt',
      title: 'Добавлен',
      format: (v) => (v ? parseDate(v).toLocaleDateString() : '—'),
    }
  )
  return cols
})

const rows = computed(() =>
  receiptStore.filterReceipts.map((item) => ({
    ...item,
    sellerDisplay: nullString(item.sellerName) || `ИНН ${item.sellerInn}`,
    userName:
      receiptStore.target == 'all' ? getUserFullName(item.userId) : null,
  }))
)

// Список для автокомплита "Сотрудник" — из реально встречающихся в текущей
// выборке (до фильтра по сотруднику, иначе выбор сузил бы сам себя) людей
const employeeOptions = computed(() => {
  const seen = new Map()
  receiptStore.receipts.forEach((r) => {
    const name = getUserFullName(r.userId)
    if (r.userId && name && !seen.has(r.userId)) seen.set(r.userId, name)
  })
  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
})

// ФИО пользователя по id из уже загруженного списка сотрудников
// (userStore.usersAll), см. VacationList.vue
function getUserFullName(userId) {
  if (!userId || !userStore.usersAll) return null
  const user = userStore.usersAll.find((u) => u.id == userId)
  if (!user) return null
  return [user.surname, user.name, user.patronymic].filter(Boolean).join(' ')
}

// свой чек всегда можно удалить/дополнить, чужой — только с
// receipts.all:delete/edit (зеркалит RequireOwnerOrAll на бэке)
function canManageRow(row) {
  if (receiptStore.target == 'all')
    return (
      userStore.hasPermission('receipts.all', 'delete') ||
      userStore.hasPermission('receipts.all', 'edit')
    )
  return true
}

function onOpen(row) {
  router.push({ name: 'receipt-view', params: { id: row.id } })
}

function onDelete(row) {
  confirmModalStore.open(async () => {
    await receiptStore.removeReceipt(row.id)
    notificationStore.addNotification('Чек удалён', 'success')
  }, 'Вы действительно хотите удалить чек?')
}

const fileInputs = new Map()

function setFileInputRef(id, el) {
  if (el) fileInputs.set(id, el)
  else fileInputs.delete(id)
}

function triggerFileInput(id) {
  fileInputs.get(id)?.click()
}

async function onFileSelected(id, event) {
  const file = event.target.files[0]
  if (!file) return

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    notificationStore.addNotification(
      'Файл слишком большой. Максимальный размер: 10MB',
      'error'
    )
    event.target.value = ''
    return
  }

  try {
    await uploadReceiptFile(id, file)
    notificationStore.addNotification('Файл прикреплён', 'success')
  } catch {
    notificationStore.addNotification('Ошибка при загрузке файла', 'error')
  }

  event.target.value = ''
}
</script>

<style scoped>
.receipt-list {
  flex: 1;

  display: flex;
  flex-direction: column;

  height: 100%;
}

.operation-type-badge {
  cursor: pointer;
  transition: opacity 0.15s;
}

.operation-type-badge:hover {
  opacity: 0.75;
}

/* toolbar-слот AppTable уже даёт flex-wrap/gap/бордер — донастраиваем только
   вертикальное выравнивание под line-style селекты */
:deep(.table-toolbar) {
  align-items: flex-end;
  gap: 2rem;
}

.receipt-list__end {
  display: flex;
  align-items: center;
  gap: var(--gap-primary);
  margin-left: auto;
}

.receipt-list__total {
  color: var(--muted-text);
}

.filters-employee {
  width: 14rem;
}

.row-actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.filter-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--background);
  color: var(--text);
  font-size: 1.14rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  :deep(.table-toolbar) {
    align-items: center;
    gap: var(--gap-primary);
  }

  .receipt-list__end {
    margin-left: 0;
  }

  .target-tabs {
    flex: 1;
    min-width: 0;
  }

  .target-tabs :deep(.tabs-item) {
    flex: 1;
    justify-content: center;
  }
}
</style>
