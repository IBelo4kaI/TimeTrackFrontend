<template>
  <div class="print-title">Отчёт по сотрудникам</div>
  <div class="table-wrapper">
    <div class="table-toolbar">
      <span class="table-title">Статистика по сотрудникам</span>
      <ButtonUI
        icon="fa-regular fa-print"
        type="muted"
        @click="print"
      ></ButtonUI>
      <SelectUI
        :model-value="modelValue"
        :options="departmentOptions"
        placeholder="Все отделы"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>

    <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th class="th align-left">Сотрудник</th>
            <th class="th align-center">Часы</th>
            <th class="th align-center">Дни</th>
            <th class="th align-center">Больничные</th>
            <th class="th align-center">Отгулы</th>
            <th class="th align-center">Отпуск</th>
            <th class="th align-center">Декрет</th>
            <th class="th align-center"></th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="isLoading">
            <td colspan="8" class="state-cell">
              <LoaderTitle />
            </td>
          </tr>

          <template v-else>
            <template v-for="section in sections" :key="section.key">
              <tr v-if="section.department !== null" class="tr-department">
                <td colspan="8" class="td-department">
                  {{ section.department }}
                </td>
              </tr>
              <tr v-for="row in section.rows" :key="row.id" class="tr">
                <td class="td align-left td-name">
                  <RouterLink
                    class="name-link"
                    :to="{ name: 'worker', params: { id: row.id } }"
                  >
                    {{ row.name }}
                  </RouterLink>
                </td>
                <template v-if="row.unavailable">
                  <td
                    v-for="n in 6"
                    :key="n"
                    class="td align-center td-muted"
                    title="Не указан пол — норму рассчитать нельзя"
                  >
                    —
                  </td>
                </template>
                <template v-else>
                  <td class="td align-center" :class="hoursVariant(row)">
                    {{ row.totalHours }} / {{ row.standardHours }}ч
                  </td>
                  <td class="td align-center" :class="daysVariant(row)">
                    {{ row.totalWorkDays }} / {{ row.standardWorkDays }}д
                  </td>
                  <td
                    class="td align-center"
                    :class="row.medicalDays > 0 ? 'destructive' : ''"
                  >
                    {{ row.medicalDays }}
                  </td>
                  <td
                    class="td align-center"
                    :class="row.timeoffDays > 0 ? 'accent' : ''"
                  >
                    {{ row.timeoffDays }}
                  </td>
                  <td
                    class="td align-center"
                    :class="row.vacationDays > 0 ? 'warn' : ''"
                  >
                    {{ row.vacationDays }}
                  </td>
                  <td class="td align-center">{{ row.decreeDays }}</td>
                </template>
                <td class="td align-center">
                  <RouterLink
                    class="calendar-link"
                    v-tooltip="'Перейти к календарю'"
                    :to="calendarLinkFor(row)"
                  >
                    <i class="fa-regular fa-calendar"></i>
                  </RouterLink>
                </td>
              </tr>
            </template>
          </template>

          <tr v-if="!isLoading && !rows.length">
            <td colspan="8" class="state-cell empty">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import SelectUI from '@/components/SelectUI.vue'
import { useReportStore } from '@/stores/report'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  departments: { type: Array, default: () => [] },
  modelValue: { type: String, default: 'all' },
})

const reportStore = useReportStore()

// Табель показывает статистику за месяц из reportStore.currentDate — календарь
// сотрудника открываем на том же месяце (см. pages/calendar/Index.vue,
// который по query id/month/year подставляет calendarStore.selectedUserId).
function calendarLinkFor(row) {
  return {
    name: 'calendar',
    query: {
      id: row.id,
      month: reportStore.currentDate.getMonth() + 1,
      year: reportStore.currentDate.getFullYear(),
    },
  }
}

defineEmits(['update:modelValue'])

const departmentOptions = computed(() => [
  { label: 'Все отделы', value: 'all' },
  ...props.departments.map((d) => ({ label: d, value: d })),
])

// "Все отделы" — с заголовками отделов, один отдел — плоский список
const sections = computed(() => {
  if (props.modelValue !== 'all') {
    return [{ key: 'all', department: null, rows: props.rows }]
  }

  const map = new Map()
  for (const row of props.rows) {
    const dept = row.department || ''
    if (!map.has(dept)) map.set(dept, [])
    map.get(dept).push(row)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'ru'))
    .map(([department, rows]) => ({
      key: department || '__none',
      department: department || 'Без отдела',
      rows,
    }))
})

// Нет нормы (0) — не красим: сравнивать не с чем
const variant = (total, standard) => {
  if (!standard) return ''
  return total >= standard ? 'success' : 'warn'
}

const hoursVariant = (row) => variant(row.totalHours, row.standardHours)
const daysVariant = (row) => variant(row.totalWorkDays, row.standardWorkDays)

function print() {
  window.print()
}
</script>

<style scoped>
.table-wrapper {
  width: 100%;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.table-toolbar {
  padding: var(--padding-secondary) var(--padding-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: var(--gap-primary);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem;
  color: var(--text);
}

.th {
  padding: var(--padding-secondary) var(--padding-primary);
  background: var(--muted-foreground);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  font-size: 1rem;
  color: var(--muted-text);
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.tr {
  border-bottom: 1px solid var(--border-color);
  transition: background 0.12s;
}

.tr:last-child {
  border-bottom: none;
}

.tr:hover {
  background: var(--background);
}

.tr-department {
  border-top: 1px solid var(--border-color);
}

.td-department {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-text);
  background: var(--muted-foreground);
  border-bottom: 1px solid var(--border-color);
}

.td {
  padding: var(--padding-secondary) var(--padding-primary);
  vertical-align: middle;
}

.td-name {
  font-weight: 600;
}

.name-link {
  color: var(--text);
  font: inherit;
  font-weight: inherit;
  text-decoration: none;
  transition: color 0.15s ease;
}

.name-link:hover {
  color: var(--accent);
}

.calendar-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.71rem;
  height: 1.71rem;
  border-radius: var(--border-radius);
  color: var(--muted-text);
  font-size: 0.86rem;
  flex-shrink: 0;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.calendar-link:hover {
  color: var(--accent);
  background: var(--background);
}

.align-left {
  text-align: left;
}
.align-center {
  text-align: center;
}

.state-cell {
  padding: 3rem var(--padding-primary);
  text-align: center;
  color: var(--muted-text);
  font-size: 0.875rem;
}

.td-muted {
  color: var(--muted-text);
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
</style>
<style>
.print-title {
  display: none;
}
@media print {
  .print-title {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    padding: 1rem;
    color: #000;
    margin-bottom: 1rem;
  }

  .table-toolbar {
    display: none !important;
  }

  .table-wrapper,
  .table-wrapper * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow: hidden;
  }
  .table {
  }
}
</style>
