<template>
  <CalculateCalendar
    :start-date="new Date(2026, 1, 10)"
    :end-date="new Date(2026, 2, 10)"
  />
</template>

<script setup>
import CalculateCalendar from './CalculateCalendar.vue'
</script>

<style scoped></style>
