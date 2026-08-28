<template>
  <div class="sick-leave-stats">
    <CardStatistics
      icon="fa-regular fa-file-certificate"
      iconVariant="success"
      :value="sickLeaveStore.sickLeaveStats.official"
      label="Официальных дней"
      valueVariant="success"
      :isLoading="sickLeaveStore.isLoading"
    />
    <CardStatistics
      icon="fa-regular fa-file-slash"
      iconVariant="warn"
      :value="sickLeaveStore.sickLeaveStats.unofficial"
      label="Неофициальных дней"
      valueVariant="warn"
      :isLoading="sickLeaveStore.isLoading"
    />
  </div>
</template>

<script setup>
import { useSickLeaveStore } from '@/stores/sick_leave'
import CardStatistics from '../CardStatistics.vue'

const sickLeaveStore = useSickLeaveStore()
</script>

<style scoped>
.sick-leave-stats {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  justify-content: space-between;
}

@media (max-width: 768px) {
  .sick-leave-stats {
    flex-direction: column;
  }
}
</style>
