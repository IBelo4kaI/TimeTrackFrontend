<template>
  <div
    class="calendar-header"
    v-for="day in !mini ? DAY_NAMES : DAY_NAMES_SHORT"
  >
    {{ day }}
  </div>
</template>

<script setup>
import { DAY_NAMES, DAY_NAMES_SHORT } from '@/constants/calendar.constants'

const props = defineProps({
  mini: false,
})
</script>

<style scoped>
.calendar-header {
  background: var(--foreground);
  padding: 0.71rem;
  text-align: center;
  border: 0.07rem solid var(--border-color);
  font-weight: 500;
  border-radius: var(--border-radius);
}
</style>
