<template>
  <div class="vacation-list">
    <AppTable
      :headers="headers"
      :rows="rows"
      row-key="id"
      :loading="vacationStore.isLoading"
      empty-text="Заявки не найдены"
    >
      <template #toolbar>
        <Tabs
          v-if="isAdmin"
          :tabs="targets"
          v-model="vacationStore.target"
          type="line"
          class="target-tabs"
        />

        <template v-if="!isMobile">
          <Tabs :tabs="filters" v-model="vacationStore.filter" type="line" />
          <MonthYearSelect
            variant="line"
            align="center"
            v-model:month="vacationStore.selectedMonth"
            v-model:year="vacationStore.selectedYear"
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

        <div class="toolbar-end">
          <ButtonUI
            v-if="userStore.hasPermission('vacation', 'create')"
            type="accent"
            icon="fa-regular fa-plus"
            v-tooltip="'Создать заявку на отпуск'"
            @click="router.push({ name: 'vacation-create' })"
          />
        </div>
      </template>

      <template #cell-status="{ row }">
        <div class="status-cell">
          <Badge :type="row.statusMeta.type">{{ row.statusMeta.text }}</Badge>
          <Badge
            v-if="row.vacationTypeName"
            type="muted"
            :style="typeBadgeStyle(row)"
          >
            {{ row.vacationTypeName }}
          </Badge>
        </div>
      </template>

      <template #cell-period="{ row }">
        <div class="period-cell">
          <span class="period-cell__dates">{{ row.periodText }}</span>
          <Badge type="muted">{{ formatStats(row.totalDays) }}</Badge>
        </div>
      </template>

      <template #cell-description="{ value }">
        <span class="description-cell">{{ value || '—' }}</span>
      </template>

      <template #actions="{ row }">
        <div class="row-actions">
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-arrow-up-right-from-square"
            v-tooltip="'Открыть заявку'"
            @click="onOpen(row)"
          />
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-file-word"
            v-tooltip="'Получить шаблон заявления'"
            @click="vacationDocs.getDocument(row.id)"
          />
          <ButtonUI
            v-if="menuItemsFor(row).length"
            type="muted-accent"
            icon="fa-regular fa-ellipsis"
            v-tooltip="'Ещё'"
            @click="openMenu($event, row)"
          />
        </div>
      </template>
    </AppTable>

    <input
      ref="fileInput"
      type="file"
      accept=".pdf"
      style="display: none"
      @change="onFileSelected"
    />

    <!-- Фильтры на мобилке — выезжающая панель, как боковое меню, вместо
    попыток впихнуть все селекты в одну строку с табами. -->
    <MobileFilterDrawer v-model="filtersOpen">
      <SelectUI
        label="Статус"
        full-width
        value-key="id"
        label-key="label"
        :options="filters"
        v-model="vacationStore.filter"
      />
      <MonthYearSelect
        label="Месяц и год"
        full-width
        v-model:month="vacationStore.selectedMonth"
        v-model:year="vacationStore.selectedYear"
      />
    </MobileFilterDrawer>

    <ContextMenu />
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import ContextMenu from '@/components/ContextMenu/ContextMenu.vue'
import MobileFilterDrawer from '@/components/MobileFilterDrawer.vue'
import MonthYearSelect from '@/components/MonthYearSelect.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import {
  approvedVacationStatus,
  deleteVacation,
  updateVacationStatus,
  uploadVacationFile,
} from '@/services/vacation.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useContextMenuStore } from '@/stores/contexMenu'
import { useNotificationStore } from '@/stores/notification'
import { useThemeStore } from '@/stores/themes.js'
import { useUserStore } from '@/stores/user.js'
import { useVacationStore } from '@/stores/vacation'
import { useVacationDocs } from '@/stores/vacationDocs'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { formatStats, getVacationStatusMeta } from '@/utils/vacation.utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const vacationStore = useVacationStore()
const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const contextMenuStore = useContextMenuStore()
const notificationStore = useNotificationStore()
const vacationDocs = useVacationDocs()
const router = useRouter()
const { isMobile } = storeToRefs(useThemeStore())

const filtersOpen = ref(false)

// vacation.all:read теперь сужен до админов/руководителей (виджет "отпуска
// коллег" использует отдельное узкое vacation_calendar:read, см.
// stores/vacationOther.js) — поэтому вкладку "Все заявки" можно гейтить
// именно им, а не vacation.all:edit: сама вкладка — просмотр, а не
// изменение (approve/reject — действия из меню строки, у них свой gate на
// .edit). GET /vacation/all/:year на бэке и так требует ровно
// vacation.all:read (RequireAll), см. internal/vacation/route.go.
const isAdmin = computed(() => userStore.hasPermission('vacation.all', 'read'))
const canManageAll = computed(() => userStore.hasPermission('vacation.all', 'edit'))

const targets = [
  { id: 'my', label: 'Мои заявки' },
  { id: 'all', label: 'Все заявки' },
]

const filters = [
  { id: 'all', label: 'Все' },
  {
    id: 'approved',
    label: 'Утвержденные',
    colors: {
      text: 'var(--success)',
      activeText: 'var(--success)',
      activeBackground: 'var(--muted-success)',
    },
  },
  {
    id: 'pending',
    label: 'На рассмотрении',
    colors: {
      text: 'var(--warn)',
      activeText: 'var(--warn)',
      activeBackground: 'var(--muted-warn)',
    },
  },
  {
    id: 'rejected',
    label: 'Отклоненные',
    colors: {
      text: 'var(--destructive)',
      activeText: 'var(--destructive)',
      activeBackground: 'var(--muted-destructive)',
    },
  },
]

/* ================== таблица ================== */

const headers = computed(() => {
  const cols = [{ valueKey: 'status', title: 'Статус' }]
  if (vacationStore.target == 'all') {
    cols.push({ valueKey: 'userName', title: 'Сотрудник' })
  }
  cols.push(
    { valueKey: 'period', title: 'Период' },
    { valueKey: 'description', title: 'Комментарий' },
    { valueKey: 'createdAtText', title: 'Создано' }
  )
  return cols
})

function getUserName(userId) {
  const u = userStore.usersAll?.find((u) => u.id == userId)
  if (!u) return '—'
  return [u.surname, u.name, u.patronymic].filter(Boolean).join(' ')
}

const rows = computed(() =>
  vacationStore.filterVacations.map((v) => {
    const start = parseDate(v.startDate)
    const end = parseDate(v.endDate)
    return {
      ...v,
      statusMeta: getVacationStatusMeta(v.status) ?? {
        type: 'destruct',
        text: 'Отклонена',
      },
      userName: getUserName(v.userId),
      periodText: `${getDateNamed(start)} - ${getDateNamed(end)} ${end.getFullYear()}`,
      createdAtText: v.createdAt?.Valid
        ? parseDate(v.createdAt.Time).toLocaleDateString()
        : '—',
    }
  })
)

function typeBadgeStyle(row) {
  const color = row.vacationTypeColor
  if (!color) return {}
  return { color, borderColor: color, background: 'transparent' }
}

function onOpen(row) {
  router.push({ name: 'vacation-application', params: { id: row.id } })
}

/* ================== действия над заявкой ================== */

// Действие над заявкой: показываем ответ сервера или его текст ошибки
const runAction = async (action, fallbackError) => {
  try {
    const resp = await action()
    notificationStore.addNotification(resp.message, 'success')
    await vacationStore.fetchVacations()
  } catch (error) {
    notificationStore.addNotification(
      error.response?.data?.error ||
        error.response?.data?.message ||
        fallbackError,
      'error'
    )
  }
}

const hasFile = (row) => vacationStore.vacationIdsWithFiles.has(row.id)

// Пункты меню строки: управление статусом — с vacation.all:edit; свою
// заявку на рассмотрении можно удалить; файл — если ещё не прикреплён
function menuItemsFor(row) {
  const items = []

  if (canManageAll.value) {
    if (row.status == 'pending') {
      items.push({ action: 'approve', label: 'Утвердить' })
    }
    if (row.status != 'pending') {
      items.push({ action: 'pending', label: 'На рассмотрении' })
    }
    if (row.status != 'rejected') {
      items.push({ action: 'rejected', label: 'Отклонить' })
    }
    items.push({ action: 'delete', label: 'Удалить отпуск', danger: true })
  } else if (row.status == 'pending') {
    items.push({ action: 'delete', label: 'Удалить отпуск', danger: true })
  }

  if (!hasFile(row) && userStore.hasPermission('vacation', 'edit')) {
    items.push({ action: 'attach', label: 'Прикрепить файл' })
  }

  return items
}

function openMenu(event, row) {
  // Клик по кнопке не должен тут же закрыть меню собственным всплытием
  event.stopPropagation()

  contextMenuStore.openMenu(event, {
    // Меню выравнивается по кнопке «Ещё», а не по точке клика
    anchor: event.currentTarget,
    items: menuItemsFor(row),
    onAction: (action) => onMenuAction(action, row),
  })
}

function onMenuAction(action, row) {
  switch (action) {
    case 'approve':
      return runAction(() => approvedVacationStatus(row.id), 'Не удалось утвердить')
    case 'pending':
    case 'rejected':
      return runAction(
        () => updateVacationStatus(row.id, action),
        'Не удалось изменить статус'
      )
    case 'delete':
      return confirmModalStore.open(
        () => runAction(() => deleteVacation(row.id), 'Не удалось удалить'),
        'Вы действительно хотите удалить?'
      )
    case 'attach':
      attachTargetId = row.id
      return fileInput.value?.click()
  }
}

/* ================== файл заявления ================== */

const fileInput = ref(null)
let attachTargetId = null

async function onFileSelected(event) {
  const file = event.target.files[0]
  const id = attachTargetId
  attachTargetId = null
  event.target.value = ''
  if (!file || !id) return

  if (file.size > 10 * 1024 * 1024) {
    notificationStore.addNotification(
      'Файл слишком большой. Максимальный размер: 10MB',
      'error'
    )
    return
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    notificationStore.addNotification(
      'Недопустимый тип файла. Разрешены: PDF',
      'error'
    )
    return
  }

  try {
    await uploadVacationFile(id, file)
    notificationStore.addNotification('Файл прикреплён', 'success')
    await vacationStore.fetchVacations()
  } catch {
    notificationStore.addNotification('Ошибка при загрузке файла', 'error')
  }
}
</script>

<style scoped>
.vacation-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.toolbar-end {
  display: flex;
  margin-left: auto;
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.period-cell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.period-cell__dates {
  font-weight: 600;
}

.description-cell {
  color: var(--muted-text);
}

.row-actions {
  display: flex;
  gap: 0.25rem;
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
