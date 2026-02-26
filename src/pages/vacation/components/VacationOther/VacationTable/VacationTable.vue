<template>
  <div class="vacation-table">
    <!-- YEAR VIEW -->
    <template v-if="isYearView">
      <VacationHeader
        :is-year-view="isYearView"
        :months="months"
        :range-start="rangeStart"
        :range-end="rangeEnd"
      />

      <VacationGroup
        v-for="group in groupedEmployees"
        :key="group.department"
        :group="group"
      >
        <VacationEmployee
          v-for="employee in group.employees"
          :key="employee.user_id"
          :employee="employee"
        >
          <VacationYearView
            :months="months"
            :vacations="getEmployeeVacations(employee.user_id)"
            :range-start="rangeStart"
            :range-end="rangeEnd"
          />
        </VacationEmployee>
      </VacationGroup>
    </template>

    <!-- MONTH VIEW -->
    <template v-else>
      <VacationHeader
        :is-year-view="isYearView"
        :days="days"
        :range-start="rangeStart"
        :range-end="rangeEnd"
      />

      <VacationGroup
        v-for="group in groupedEmployees"
        :key="group.department"
        :group="group"
      >
        <VacationEmployee
          v-for="employee in group.employees"
          :key="employee.user_id"
          :employee="employee"
        >
          <VacationMonthView
            :days="days"
            :vacations="getEmployeeVacations(employee.user_id)"
          />
        </VacationEmployee>
      </VacationGroup>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useVacationOther } from '@/stores/vacationOther'
import { diffDays, toDateStr } from './vacationUtils.js'
import VacationHeader from './VacationHeader.vue'
import VacationGroup from './VacationGroup.vue'
import VacationEmployee from './VacationEmployee.vue'
import VacationYearView from './VacationYearView.vue'
import VacationMonthView from './VacationMonthView.vue'

const store = useVacationOther()

const isYearView = computed(() => store.filters.viewMode === 'year')

// ─── Dates ────────────────────────────────────────────────────────────────────

const rangeStart = computed(() => {
  if (isYearView.value) return new Date(store.filters.year, 0, 1)
  return new Date(store.filters.year, store.filters.month - 1, 1)
})

const rangeEnd = computed(() => {
  if (isYearView.value) return new Date(store.filters.year, 11, 31)
  return new Date(store.filters.year, store.filters.month, 0)
})

// ─── Year view ────────────────────────────────────────────────────────────────

const months = computed(() => {
  const result = []
  for (let m = 0; m < 12; m++) {
    result.push(new Date(store.filters.year, m, 1))
  }
  return result
})

// ─── Month view ───────────────────────────────────────────────────────────────

const days = computed(() => {
  const result = []
  const count = rangeEnd.value.getDate()
  for (let d = 1; d <= count; d++) {
    const date = new Date(store.filters.year, store.filters.month - 1, d)
    result.push({
      date,
      dateStr: toDateStr(date),
      num: d,
      label: date.toLocaleString('ru', { weekday: 'short' }).slice(0, 2),
    })
  }
  return result
})

// ─── Employees & Vacations ────────────────────────────────────────────────────

const groupedEmployees = computed(() => store.filteredEmployeesGrouped)

function getEmployeeVacations(employeeId) {
  return (store.filteredVacations || []).filter((v) => {
    if (v.userId !== employeeId) return false
    const start = parseLocalDate(v.startDate)
    const end = parseLocalDate(v.endDate)
    return start <= rangeEnd.value && end >= rangeStart.value
  })
}

// Парсим "2024-03-01" как локальную дату, а не UTC.
function parseLocalDate(str) {
  const [y, m, d] = str.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

onMounted(async () => {
  await store.initialFetch()
})
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
.vacation-table {
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  overflow: hidden;
}
</style>
