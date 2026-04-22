<template>
  <div class="container">
    <ControlsCalendar :store="calendarStore" />
    <LegendCalendar />
    <div class="container-row">
      <DayListCalendar style="flex: 1" />
      <StatisticsCalendar />
    </div>
  </div>
</template>

<script setup>
import StatisticsCalendar from '@/components/Calendar/StatisticsCalendar.vue'
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { computed } from 'vue'
import LegendCalendar from '../../components/Calendar/LegendCalendar.vue'
import DayListCalendar from './components/DayListCalendar.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Календарь', 'Учёт рабочих дней')
const calendarStore = useCalendarStore()

const workingHoursRows = computed(() => [
  {
    label: 'Норма часов',
    value: `${calendarStore.workingHours.standardHours} ч`,
  },
  {
    label: 'Отработано',
    value: `${calendarStore.workingHours.totalHours} ч`,
    valueVariant: 'success',
  },
])
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
.container-row {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
}
</style>
