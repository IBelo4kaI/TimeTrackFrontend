<template>
  <div class="vacation-other">
    <VacationFilters />
    <VacationTable />
  </div>
</template>

<script setup>
import VacationFilters from './VacationFilters.vue'
import VacationTable from './VacationTable/VacationTable.vue'
</script>

<style scoped>
.vacation-other {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}
</style>
