<template>
  <div class="vacation-group__employee-days">
    <div
      class="vacation-group__employee-day"
      :class="{
        'vacation-group__employee-day--weekend': isWeekend(day.date),
      }"
      v-for="day in days"
      :key="day.dateStr"
    >
      <div
        v-if="getDayVacation(day.date)"
        class="vacation-cell"
        :class="[
          `vacation-cell--${getDayVacation(day.date).status}`,
          {
            'vacation-cell--start': isVacationStart(day.date),
            'vacation-cell--end': isVacationEnd(day.date),
          },
        ]"
        v-tooltip="{ content: getVacationTooltip(getDayVacation(day.date)) }"
      />
    </div>
  </div>
</template>

<script setup>
import {
  parseLocalDate,
  toDateStr,
  isWeekend,
  formatDateForTooltip,
  getStatusInRussian,
} from './vacationUtils.js'

const props = defineProps({
  days: {
    type: Array,
    required: true,
  },
  vacations: {
    type: Array,
    required: true,
  },
})

function getDayVacation(date) {
  return props.vacations.find((v) => {
    return (
      date >= parseLocalDate(v.startDate) && date <= parseLocalDate(v.endDate)
    )
  })
}

function isVacationStart(date) {
  const v = getDayVacation(date)
  if (!v) return false
  return toDateStr(date) === v.startDate.slice(0, 10)
}

function isVacationEnd(date) {
  const v = getDayVacation(date)
  if (!v) return false
  return toDateStr(date) === v.endDate.slice(0, 10)
}

function getVacationTooltip(vacation) {
  if (!vacation) return ''

  const startDate = formatDateForTooltip(vacation.startDate)
  const endDate = formatDateForTooltip(vacation.endDate)
  const status = getStatusInRussian(vacation.status)

  return `Начало: ${startDate}\nКонец: ${endDate}\nСтатус: ${status}`
}
</script>

<style scoped>
.vacation-group__employee-days {
  flex: 1;
  display: flex;
}

.vacation-group__employee-day {
  flex: 1;
  min-width: 1.75rem;
  position: relative;
  height: 3rem;
  border-right: 0.07rem solid var(--border-color);
}
.vacation-group__employee-day:last-child {
  border-right: none;
}
.vacation-group__employee-day--weekend {
  background: var(--calendar-weekend, rgba(0, 0, 0, 0.03));
}

.vacation-cell {
  position: absolute;
  inset: 0.375rem 0;
  opacity: 0.85;
}
.vacation-cell--start {
  margin-left: 0.25rem;
  border-radius: 0.375rem 0 0 0.375rem;
}
.vacation-cell--end {
  margin-right: 0.25rem;
  border-radius: 0 0.375rem 0.375rem 0;
}
.vacation-cell--start.vacation-cell--end {
  margin: 0.375rem 0.25rem;
  border-radius: 0.375rem;
}

/* Status colors */
.vacation-cell--approved {
  background: var(--success);
}

.vacation-cell--pending {
  background: var(--warn);
}

.vacation-cell--rejected {
  background: var(--destructive);
}
</style>
