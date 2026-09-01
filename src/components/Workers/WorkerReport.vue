<template>
  <div class="worker-report">
    <div v-if="workerStore.timesheetUnavailable" class="empty-state">
      Недостаточно данных о сотруднике (не указан пол) — норма часов/дней не
      рассчитывается.
    </div>

    <AppTable
      v-else
      :headers="headers"
      :rows="rows"
      row-key="month"
      :loading="workerStore.isLoadingTimesheet"
      empty-text="Нет данных за год"
    >
      <template #toolbar>
        <span class="table-title">Табель за год</span>
        <SelectUI
          variant="line"
          align="center"
          :options="years"
          v-model="workerStore.timesheetYear"
          @change="workerStore.loadTimesheet"
        />
      </template>

      <template #cell-monthLabel="{ row }">
        <span :class="{ 'row-total': row.isTotal }">{{ row.monthLabel }}</span>
      </template>

      <template #cell-hours="{ row }">
        <span :class="[hoursVariant(row), { 'row-total': row.isTotal }]">
          {{ row.totalHours }} / {{ row.standardHours }}ч
        </span>
      </template>

      <template #cell-workDays="{ row }">
        <span :class="[daysVariant(row), { 'row-total': row.isTotal }]">
          {{ row.totalWorkDays }} / {{ row.standardWorkDays }}д
        </span>
      </template>

      <template #cell-medicalDays="{ row }">
        <span :class="row.medicalDays > 0 ? 'destructive' : ''">
          {{ row.medicalDays }}
        </span>
      </template>

      <template #cell-timeoffDays="{ row }">
        <span :class="row.timeoffDays > 0 ? 'accent' : ''">
          {{ row.timeoffDays }}
        </span>
      </template>

      <template #cell-vacationDays="{ row }">
        <span :class="row.vacationDays > 0 ? 'warn' : ''">
          {{ row.vacationDays }}
        </span>
      </template>

      <template #actions="{ row }">
        <ButtonUI
          v-if="!row.isTotal"
          type="muted-accent"
          icon="fa-regular fa-calendar-days"
          v-tooltip="'Открыть месяц в календаре'"
          @click="openInCalendar(row.month)"
        />
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import SelectUI from '@/components/SelectUI.vue'
import { MONTH_NAMES } from '@/constants/calendar.constants'
import { useWorkerStore } from '@/stores/worker'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const workerStore = useWorkerStore()

const headers = [
  { valueKey: 'monthLabel', title: 'Месяц' },
  { valueKey: 'hours', title: 'Часы', align: 'center' },
  { valueKey: 'workDays', title: 'Дни', align: 'center' },
  { valueKey: 'medicalDays', title: 'Больничные', align: 'center' },
  { valueKey: 'timeoffDays', title: 'Отгулы', align: 'center' },
  { valueKey: 'vacationDays', title: 'Отпуск', align: 'center' },
  { valueKey: 'decreeDays', title: 'Декрет', align: 'center' },
]

const years = computed(() => [
  workerStore.timesheetYear - 1,
  workerStore.timesheetYear,
  workerStore.timesheetYear + 1,
])

const rows = computed(() => {
  if (!workerStore.timesheetMonths.length) return []

  const months = workerStore.timesheetMonths.map((m) => ({
    ...m,
    monthLabel: MONTH_NAMES[m.month - 1],
  }))

  return [
    ...months,
    { ...workerStore.timesheetTotals, month: 'total', monthLabel: 'Итого', isTotal: true },
  ]
})

const hoursVariant = (row) => {
  if (row.totalHours >= row.standardHours) return 'success'
  return 'warn'
}

const daysVariant = (row) => {
  if (row.totalWorkDays >= row.standardWorkDays) return 'success'
  return 'warn'
}

// Календарь (day-грид с редактированием записей) уже умеет открывать чужой
// месяц по query-параметрам (см. pages/calendar/Index.vue) — переиспользуем
// это вместо повторной реализации грида здесь.
function openInCalendar(month) {
  router.push({
    name: 'calendar',
    query: {
      id: workerStore.employeeId,
      month,
      year: workerStore.timesheetYear,
    },
  })
}

onMounted(workerStore.loadTimesheet)
</script>

<style scoped>
.worker-report {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.row-total {
  font-weight: 700;
}

.success {
  color: var(--success);
  font-weight: 600;
}
.warn {
  color: var(--warn);
  font-weight: 600;
}
.destructive {
  color: var(--destructive);
  font-weight: 600;
}
.accent {
  color: var(--accent);
  font-weight: 600;
}

.empty-state {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  color: var(--muted-text);
  font-size: 0.93rem;
}
</style>
