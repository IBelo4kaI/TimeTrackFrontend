<template>
  <div class="container">
    <ControlsCalendar :store="calendarStore" />
    <LegendCalendar />
    <DayListCalendar />
  </div>
</template>

<script setup>
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import LegendCalendar from '../../components/Calendar/LegendCalendar.vue'
import DayListCalendar from './components/DayListCalendar.vue'
import { useCalendarStore } from '@/stores/calendar'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Календарь', 'Учёт рабочих дней')
const calendarStore = useCalendarStore()
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
</style>
