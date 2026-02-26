<template>
  <div class="vacation-group__employee-track">
    <!-- month grid lines -->
    <div
      class="vacation-track__grid-line"
      v-for="(month, i) in months"
      :key="i"
      :style="{ left: monthOffsetPercent(month) + '%' }"
    />
    <!-- vacation bars -->
    <div
      class="vacation-bar"
      :class="`vacation-bar--${vacation.status}`"
      v-for="vacation in vacations"
      :key="vacation.id"
      :style="vacationBarStyle(vacation)"
      v-tooltip="{
        content: getVacationTooltip(vacation),
      }"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  clamp,
  parseLocalDate,
  diffDays,
  formatDateForTooltip,
  getStatusInRussian,
} from './vacationUtils.js'

const props = defineProps({
  months: {
    type: Array,
    required: true,
  },
  vacations: {
    type: Array,
    required: true,
  },
  rangeStart: {
    type: Date,
    required: true,
  },
  rangeEnd: {
    type: Date,
    required: true,
  },
})

const totalDays = computed(() => diffDays(props.rangeStart, props.rangeEnd) + 1)

function monthOffsetPercent(monthDate) {
  const offset = diffDays(props.rangeStart, monthDate)
  return (offset / totalDays.value) * 100
}

function vacationBarStyle(vacation) {
  const start = clamp(
    parseLocalDate(vacation.startDate),
    props.rangeStart,
    props.rangeEnd
  )
  const end = clamp(
    parseLocalDate(vacation.endDate),
    props.rangeStart,
    props.rangeEnd
  )
  const startOffset = diffDays(props.rangeStart, start)
  const duration = diffDays(start, end) + 1
  return {
    left: (startOffset / totalDays.value) * 100 + '%',
    width: (duration / totalDays.value) * 100 + '%',
  }
}

function getVacationTooltip(vacation) {
  const startDate = formatDateForTooltip(vacation.startDate)
  const endDate = formatDateForTooltip(vacation.endDate)
  const status = getStatusInRussian(vacation.status)

  return `Начало: ${startDate}\nКонец: ${endDate}\nСтатус: ${status}`
}
</script>

<style scoped>
.vacation-group__employee-track {
  flex: 1;
  position: relative;
  height: 3rem;
}

.vacation-track__grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 0.07rem solid var(--border-color);
  opacity: 0.4;
}

.vacation-bar {
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  border-radius: 0.375rem;
  min-width: 4px;
  opacity: 0.85;
  transition: opacity 0.15s;
}
.vacation-bar:hover {
  opacity: 1;
}

/* Status colors */
.vacation-bar--approved {
  background: var(--success);
}

.vacation-bar--pending {
  background: var(--warn);
}

.vacation-bar--rejected {
  background: var(--destructive);
}
</style>
