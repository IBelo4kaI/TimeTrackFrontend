<template>
  <div class="calendar">
    <HeaderCalendar :mini="true" />
    <slot :class="dayClass"></slot>
  </div>
</template>
<script setup>
import HeaderCalendar from '@/components/Calendar/HeaderCalendar.vue'
const dayClass = 'day'
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
