<template>
  <div class="vacation-other">
    <div class="vacation-other-header">
      <div class="vacation-other-title">Отпуска других сотрудников</div>
    </div>
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
.vacation-other-header {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  flex-wrap: wrap;
}
.vacation-other-title {
  display: flex;
  align-items: center;
  height: 3rem;
  padding: 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}
</style>
