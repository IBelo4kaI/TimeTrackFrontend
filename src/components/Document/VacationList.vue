<template>
  <AppTable
    :headers="headers"
    :rows="filteredRows"
    :loading="isLoading"
    :empty-text="emptyText"
  >
    <template #toolbar>
      <InputUi
        v-model="filters.search"
        label="Поиск"
        placeholder="Сотрудник или файл"
        class="filters-search"
      >
        <template #prefix><i class="fa-regular fa-magnifying-glass"></i></template>
      </InputUi>

      <SelectUI
        v-model="filters.status"
        :options="statusOptions"
        label="Статус"
        placeholder="Все статусы"
      />
      <Autocomplete
        v-model="filters.ownerId"
        :options="ownerOptions"
        label-key="label"
        value-key="value"
        :is-show-button="false"
        label="Сотрудник"
        placeholder="Все сотрудники"
        empty-text="Сотрудник не найден"
        class="filters-person"
      />
      <Autocomplete
        v-model="filters.uploadedById"
        :options="uploaderOptions"
        label-key="label"
        value-key="value"
        :is-show-button="false"
        label="Загрузил"
        placeholder="Все"
        empty-text="Не найдено"
        class="filters-person"
      />

      <InputUi
        v-model="filters.dateFrom"
        type="date"
        label="Период с"
        class="filters-date"
      />
      <InputUi
        v-model="filters.dateTo"
        type="date"
        label="Период по"
        class="filters-date"
      />

      <SelectUI align="center" :options="years" v-model="selectedYear" label="Год" />

      <ButtonUI
        v-if="hasActiveFilters"
        type="muted"
        icon="fa-regular fa-filter-slash"
        v-tooltip="'Сбросить фильтры'"
        @click="resetFilters"
      ></ButtonUI>
    </template>

    <template #cell-fileName="{ row }">
      <RouterLink
        class="file-link"
        :to="{
          name: 'vacation-file-viewer',
          params: { id: row.entityId },
        }"
      >
        <i class="fa-regular fa-file-pdf"></i>
        {{ row.fileName }}
      </RouterLink>
    </template>

    <template #cell-period="{ row }">
      {{ row.period ?? '—' }}
    </template>

    <template #cell-status="{ row }">
      <Badge v-if="row.status" :type="row.status.type">
        {{ row.status.text }}
      </Badge>
      <span v-else>—</span>
    </template>

    <template #actions="{ row }">
      <div class="row-actions">
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-circle-info"
          @click="onOpen(row)"
          v-tooltip="'Информация о заявке'"
        ></ButtonUI>
        <ButtonUI
          v-if="userStore.hasPermission('files', 'delete')"
          type="destructive"
          icon="fa-regular fa-trash-can-xmark"
          @click="onDelete(row)"
          v-tooltip="'Удалить файл'"
        ></ButtonUI>
      </div>
    </template>
  </AppTable>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppTable from '../AppTable.vue'
import Autocomplete from '../Autocomplete.vue'
import Badge from '../Badge.vue'
import ButtonUI from '../ButtonUI.vue'
import InputUi from '../InputUi.vue'
import SelectUI from '../SelectUI.vue'
import { deleteFile, getEntityTypeFiles } from '@/services/files.api'
import { getAllUserVacationsByYear } from '@/services/vacation.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { getVacationStatusMeta } from '@/utils/vacation.utils'

const userStore = useUserStore()
const notificationStore = useNotificationStore()
const confirmModalStore = useConfirmModal()
const router = useRouter()

const selectedYear = ref(new Date().getFullYear())
const years = computed(() => [
  selectedYear.value - 1,
  selectedYear.value,
  selectedYear.value + 1,
])

const files = ref([])
// entityId (id отпуска) -> сам отпуск, за выбранный год
const vacationByEntityId = ref({})
const isLoading = ref(false)

const headers = [
  { valueKey: 'fileName', title: 'Файл' },
  { valueKey: 'ownerName', title: 'Сотрудник' },
  { valueKey: 'period', title: 'Период отпуска' },
  { valueKey: 'status', title: 'Статус' },
  { valueKey: 'uploadedByName', title: 'Загрузил' },
  {
    valueKey: 'createdAt',
    title: 'Загружено',
    format: (value) => (value ? new Date(value).toLocaleDateString() : '—'),
  },
]

const rows = computed(() =>
  files.value.map((file) => {
    const vacation = vacationByEntityId.value[file.entityId]
    return {
      ...file,
      fileName: file.originalName ?? 'Без названия',
      period: vacation ? buildPeriod(vacation) : null,
      status: vacation ? getVacationStatusMeta(vacation.status) : null,
      // Сырой статус/id — для фильтрации (status/ownerName выше уже
      // человекочитаемые, для select'ов и сравнения нужны исходные значения).
      statusValue: vacation?.status ?? null,
      // К кому привязана заявка — узнаём по userId самого отпуска, а не по
      // тому, кто грузил файл (это может быть разными людьми, если файл
      // прикрепил админ за сотрудника).
      ownerId: vacation?.userId ?? null,
      ownerName: vacation ? getUserFullName(vacation.userId) : null,
      uploadedByName: getUserFullName(file.uploadedByUserId),
      // Даты периода отпуска как Date — для фильтра по диапазону дат.
      periodStart: vacation ? parseDate(vacation.startDate) : null,
      periodEnd: vacation ? parseDate(vacation.endDate) : null,
    }
  })
)

// --- Фильтры: поиск + селекты по колонкам + диапазон дат периода ---

const filters = ref({
  search: '',
  status: 'all',
  // Автокомплиты (не фиксированный список, в отличие от статуса/года) —
  // пусто, а не 'all': это то, что Autocomplete сам пишет в модель, когда
  // выбор снят кнопкой очистки.
  ownerId: '',
  uploadedById: '',
  dateFrom: '',
  dateTo: '',
})

const statusOptions = [
  { label: 'Все статусы', value: 'all' },
  { label: 'Утверждена', value: 'approved' },
  { label: 'На рассмотрении', value: 'pending' },
  { label: 'Отклонена', value: 'rejected' },
]

// Списки для автокомплитов «Сотрудник»/«Загрузил» строим из реально
// встречающихся в текущих строках людей (как отделы в Report/ReportTable.vue),
// а не из всего справочника пользователей — не предлагаем тех, кого в
// таблице всё равно нет. Без синтетического пункта "Все" — за это отвечает
// пустое значение (плейсхолдер + кнопка очистки самого Autocomplete).
function buildPersonOptions(idKey, nameKey) {
  const seen = new Map()
  rows.value.forEach((row) => {
    if (row[idKey] && row[nameKey] && !seen.has(row[idKey])) {
      seen.set(row[idKey], row[nameKey])
    }
  })

  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}

const ownerOptions = computed(() => buildPersonOptions('ownerId', 'ownerName'))
const uploaderOptions = computed(() =>
  buildPersonOptions('uploadedByUserId', 'uploadedByName')
)

const hasActiveFilters = computed(() => {
  const f = filters.value
  return (
    f.search.trim() !== '' ||
    f.status !== 'all' ||
    f.ownerId !== '' ||
    f.uploadedById !== '' ||
    f.dateFrom !== '' ||
    f.dateTo !== ''
  )
})

const filteredRows = computed(() => {
  const term = filters.value.search.trim().toLowerCase()
  const from = filters.value.dateFrom ? new Date(filters.value.dateFrom) : null
  const to = filters.value.dateTo ? new Date(filters.value.dateTo) : null
  if (to) to.setHours(23, 59, 59, 999) // конечная дата включительно, до конца дня

  return rows.value.filter((row) => {
    if (filters.value.status !== 'all' && row.statusValue !== filters.value.status) {
      return false
    }
    if (filters.value.ownerId && row.ownerId !== filters.value.ownerId) {
      return false
    }
    if (
      filters.value.uploadedById &&
      row.uploadedByUserId !== filters.value.uploadedById
    ) {
      return false
    }

    if (term) {
      const haystack = [row.ownerName, row.uploadedByName, row.originalName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(term)) return false
    }

    if (from || to) {
      // Нет данных о периоде (файл без привязанной заявки) — под фильтр
      // по датам не попадает, показывать нечего.
      if (!row.periodStart || !row.periodEnd) return false
      // Пересечение диапазонов: заявка проходит, если её период хоть
      // немного пересекается с выбранным [from, to].
      if (from && row.periodEnd < from) return false
      if (to && row.periodStart > to) return false
    }

    return true
  })
})

const emptyText = computed(() =>
  hasActiveFilters.value && files.value.length
    ? 'Ничего не найдено по заданным фильтрам'
    : 'Заявлений на отпуск пока нет'
)

function resetFilters() {
  filters.value = {
    search: '',
    status: 'all',
    ownerId: '',
    uploadedById: '',
    dateFrom: '',
    dateTo: '',
  }
}

// ФИО пользователя по id из уже загруженного списка сотрудников
// (userStore.usersAll) — без похода за отдельным справочником.
function getUserFullName(userId) {
  if (!userId) return null
  const user = userStore.usersAll.find((u) => u.id === userId)
  if (!user) return null
  return [user.surname, user.name, user.patronymic].filter(Boolean).join(' ')
}

function buildPeriod(vacation) {
  const start = parseDate(vacation.startDate)
  const end = parseDate(vacation.endDate)
  return `${getDateNamed(start)} – ${getDateNamed(end)} ${end.getFullYear()}`
}

async function load() {
  isLoading.value = true
  try {
    const [filesResult, vacationsResult] = await Promise.all([
      getEntityTypeFiles('vacation', selectedYear.value),
      getAllUserVacationsByYear(selectedYear.value).catch(() => []),
    ])

    files.value = filesResult ?? []
    vacationByEntityId.value = Object.fromEntries(
      (vacationsResult ?? []).map((v) => [v.id, v])
    )
  } catch {
    notificationStore.addNotification(
      'Не удалось загрузить заявления на отпуск',
      'error'
    )
  } finally {
    isLoading.value = false
  }
}

function onOpen(row) {
  router.push({
    name: 'vacation-application',
    params: { id: row.entityId },
  })
}

function onDelete(row) {
  confirmModalStore.open(async () => {
    try {
      await deleteFile(row.id)
      notificationStore.addNotification('Файл удалён', 'success')
      await load()
    } catch {
      notificationStore.addNotification('Ошибка при удалении файла', 'error')
    }
  }, 'Вы действительно хотите удалить файл?')
}

watch(selectedYear, load)
onMounted(load)
</script>

<style scoped>
/* Тулбар: у одних фильтров теперь есть label сверху, у других (кнопка
   сброса) — нет, поэтому центрируем не по центру, а по нижнему краю, чтобы
   сами поля ввода были на одной линии. */
:deep(.table-toolbar) {
  align-items: flex-end;
}

.row-actions {
  display: flex;
  gap: 0.35rem;
}

.filters-search {
  width: 16rem;
}

.filters-person {
  width: 14rem;
}

.filters-date {
  width: 9.3rem;
}

.file-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.file-link:hover {
  color: var(--accent);
}
</style>
