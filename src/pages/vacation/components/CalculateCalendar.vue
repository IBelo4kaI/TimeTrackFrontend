<template>
  <div class="calendar">
    <HeaderCalendar :mini="true" />
    <div class="day" v-for="day in daysPrev">{{ day.date.getDate() }}</div>
    <div class="day" v-for="day in daysNext">{{ day.date.getDate() }}</div>
  </div>
</template>
<script setup>
import HeaderCalendar from '@/components/Calendar/HeaderCalendar.vue'
import {
  generateDaysAfterDate,
  generateDaysBeforeDate,
} from '@/helpers/calendar.helpers'
import { computed } from 'vue'

const { startDate, days, endDate } = defineProps([
  'startDate',
  'days',
  'endDate',
])

const daysNext = computed(() => {
  if (startDate.getMonth() == endDate.getMonth())
    return generateDaysAfterDate(endDate)
  else return []
})
const daysPrev = computed(() => generateDaysBeforeDate(startDate))
</script>

<style lang="css" scoped>
.calendar {
  display: inline-grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  gap: calc(var(--padding-secondary) / 2);
  overflow: auto;
}
.day {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
</style>
