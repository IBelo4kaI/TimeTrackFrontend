<template>
  <div class="table-wrapper">
    <div class="table-toolbar">
      <span class="table-title">Статистика по сотрудникам</span>
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
            <th class="th align-center">Норма ч</th>
            <th class="th align-center">Отработано ч</th>
            <th class="th align-center">Норма д</th>
            <th class="th align-center">Отработано д</th>
            <th class="th align-center">Больничные</th>
            <th class="th align-center">Отгулы</th>
            <th class="th align-center">Отпуск</th>
            <th class="th align-center">Декрет</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="isLoading">
            <td colspan="9" class="state-cell">
              <Loader />
            </td>
          </tr>

          <template v-else-if="isGrouped">
            <template v-for="group in groupedRows" :key="group.department">
              <tr class="tr-department">
                <td colspan="9" class="td-department">
                  {{ group.department || 'Без отдела' }}
                </td>
              </tr>
              <tr v-for="row in group.rows" :key="row.id" class="tr">
                <td class="td align-left td-name">{{ row.name }}</td>
                <td class="td align-center">{{ row.standardHours }}</td>
                <td class="td align-center" :class="hoursVariant(row)">
                  {{ row.totalHours }}
                </td>
                <td class="td align-center">{{ row.standardWorkDays }}</td>
                <td class="td align-center" :class="daysVariant(row)">
                  {{ row.totalWorkDays }}
                </td>
                <td class="td align-center destructive">
                  {{ row.medicalDays }}
                </td>
                <td class="td align-center accent">
                  {{ row.timeoffDays }}
                </td>
                <td class="td align-center warn">
                  {{ row.vacationDays }}
                </td>
                <td class="td align-center">{{ row.decreeDays }}</td>
              </tr>
            </template>
          </template>

          <template v-else>
            <tr v-for="row in rows" :key="row.id" class="tr">
              <td class="td align-left td-name">{{ row.name }}</td>
              <td class="td align-center">{{ row.standardHours }}</td>
              <td class="td align-center" :class="hoursVariant(row)">
                {{ row.totalHours }}
              </td>
              <td class="td align-center">{{ row.standardWorkDays }}</td>
              <td class="td align-center" :class="daysVariant(row)">
                {{ row.totalWorkDays }}
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
            </tr>
          </template>

          <tr v-if="!isLoading && !rows.length">
            <td colspan="9" class="state-cell empty">Нет данных</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import SelectUI from '@/components/SelectUI.vue'
import Loader from '@/components/Loader.vue'
import { computed } from 'vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  departments: { type: Array, default: () => [] },
  modelValue: { type: String, default: 'all' },
})

defineEmits(['update:modelValue'])

const departmentOptions = computed(() => [
  { label: 'Все отделы', value: 'all' },
  ...props.departments.map((d) => ({ label: d, value: d })),
])

const isGrouped = computed(() => props.modelValue === 'all')

const groupedRows = computed(() => {
  const map = new Map()
  for (const row of props.rows) {
    const dept = row.department || ''
    if (!map.has(dept)) map.set(dept, [])
    map.get(dept).push(row)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'ru'))
    .map(([department, rows]) => ({ department, rows }))
})

const hoursVariant = (row) => {
  if (row.totalHours >= row.standardHours) return 'success'
  if (row.totalHours > 0) return 'warn'
  return 'warn'
}

const daysVariant = (row) => {
  if (row.totalWorkDays >= row.standardWorkDays) return 'success'
  if (row.totalWorkDays > 0) return 'warn'
  return 'warn'
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
