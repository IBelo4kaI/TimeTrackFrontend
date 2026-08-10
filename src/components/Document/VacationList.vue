<template>
  <AppTable
    :headers="headers"
    :rows="rows"
    :loading="isLoading"
    empty-text="Заявлений на отпуск пока нет"
  >
    <template #toolbar>
      <SelectUI
        variant="line"
        align="center"
        :options="years"
        v-model="selectedYear"
      />
    </template>

    <template #cell-name="{ row }">
      <RouterLink
        class="file-link"
        :to="{ name: 'vacation-application', params: { id: row.entityId } }"
      >
        <i class="fa-regular fa-file-pdf"></i>
        {{ row.name }}
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
      <ButtonUI
        type="muted-accent"
        icon="fa-regular fa-file-export"
        @click="onOpen(row)"
        v-tooltip="'Открыть файл'"
      >
        Открыть
      </ButtonUI>
      <ButtonUI
        v-if="userStore.hasPermission('files', 'delete')"
        type="destructive"
        icon="fa-regular fa-trash-can-xmark"
        @click="onDelete(row)"
        v-tooltip="'Удалить файл'"
      >
        Удалить
      </ButtonUI>
    </template>
  </AppTable>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppTable from '../AppTable.vue'
import Badge from '../Badge.vue'
import ButtonUI from '../ButtonUI.vue'
import SelectUI from '../SelectUI.vue'
import { deleteFile, getEntityTypeFiles, openFile } from '@/services/files.api'
import { getAllUserVacationsByYear } from '@/services/vacation.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { formatNameFull } from '@/utils/vacation-docs.utils'
import { getVacationStatusMeta } from '@/utils/vacation.utils'

const userStore = useUserStore()
const notificationStore = useNotificationStore()
const confirmModalStore = useConfirmModal()

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
  { valueKey: 'name', title: 'Заявление' },
  { valueKey: 'period', title: 'Период отпуска' },
  { valueKey: 'status', title: 'Статус' },
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
      name: buildDisplayName(vacation, file),
      period: vacation ? buildPeriod(vacation) : null,
      status: vacation ? getVacationStatusMeta(vacation.status) : null,
    }
  })
)

function buildDisplayName(vacation, file) {
  const userId = vacation?.userId ?? file.uploadedByUserId
  const user = userStore.usersAll.find((u) => u.id === userId)

  if (!user) return 'Заявление на отпуск'

  const fullName = [user.surname, user.name, user.patronymic]
    .filter(Boolean)
    .join(' ')

  return `Заявление от ${formatNameFull(fullName, 'genitive')}`
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

async function onOpen(row) {
  try {
    const blob = await openFile(row.id)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } catch {
    notificationStore.addNotification('Ошибка при открытии файла', 'error')
  }
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
