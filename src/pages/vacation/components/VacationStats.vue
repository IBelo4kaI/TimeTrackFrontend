<template>
  <div class="vacation-stats">
    <CardStatistics
      icon="fa-regular fa-calendar"
      iconVariant="warn"
      :value="vacationStore.vacationStats.used"
      label="Использовано"
      valueVariant="warn"
      :isLoading="vacationStore.isLoading"
      :progress="
        percent(
          vacationStore.vacationStats.used,
          vacationStore.vacationStats.free + vacationStore.vacationStats.used
        )
      "
    />
    <CardStatistics
      icon="fa-regular fa-check-circle"
      iconVariant="success"
      :value="vacationStore.vacationStats.free"
      label="Осталось"
      valueVariant="success"
      :isLoading="vacationStore.isLoading"
      :progress="
        percent(
          vacationStore.vacationStats.free,
          vacationStore.vacationStats.free + vacationStore.vacationStats.used
        )
      "
    />
    <CardStatistics
      icon="fa-regular fa-clock"
      iconVariant="primary"
      :value="vacationStore.vacationStats.pending"
      label="Ожидает"
      valueVariant="primary"
      :isLoading="vacationStore.isLoading"
      :progress="
        percent(
          vacationStore.vacationStats.pending,
          vacationStore.vacationStats.free + vacationStore.vacationStats.used
        )
      "
    />
    <NextVacationCard />
  </div>
</template>

<script setup>
import { useVacationStore } from '@/stores/vacation'
import CardStatistics from './StatisticsCard.vue'
import NextVacationCard from './NextVacationCard.vue'

const vacationStore = useVacationStore()

const percent = (num, all) => Math.abs((num / all) * 100)
</script>

<style scoped>
.vacation-stats {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  justify-content: space-between;
}

@media (max-width: 768px) {
  .vacation-stats {
    flex-direction: column;
  }
}
</style>
