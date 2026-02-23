<template>
  <div class="vacation-stats">
    <CardStatistics
      icon="fa-regular fa-calendar"
      iconVariant="warn"
      :value="vacationStore.vacationStats.used"
      label="Использовано"
      valueVariant="warn"
    />
    <CardStatistics
      icon="fa-regular fa-check-circle"
      iconVariant="success"
      :value="vacationStore.vacationStats.free"
      label="Осталось"
      valueVariant="success"
    />
    <CardStatistics
      icon="fa-regular fa-clock"
      iconVariant="primary"
      :value="vacationStore.vacationStats.pending"
      label="Ожидает"
      valueVariant="primary"
    />
  </div>
</template>

<script setup>
import { useVacationStore } from '@/stores/vacation'
import CardStatistics from './CardStatistics.vue'

const vacationStore = useVacationStore()
</script>

<style scoped></style>
