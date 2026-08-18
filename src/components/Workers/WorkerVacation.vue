<template>
  <div class="worker-vacation">
    <AppTable
      :headers="headers"
      :rows="rows"
      row-key="year"
      :loading="workerStore.isLoadingVacationStats"
      empty-text="Нет данных по отпускам"
    >
      <template #toolbar>
        <span class="table-title">Баланс отпуска по годам</span>
      </template>

      <template #cell-year="{ row }">
        <span :class="{ 'row-total': row.isTotal }">
          {{ row.isTotal ? 'Итого' : row.year }}
        </span>
      </template>

      <template #cell-used="{ row }">
        <span :class="['warn', { 'row-total': row.isTotal }]">{{ row.used }}</span>
      </template>

      <template #cell-free="{ row }">
        <span :class="['success', { 'row-total': row.isTotal }]">{{ row.free }}</span>
      </template>

      <template #cell-pending="{ row }">
        <span :class="[row.pending > 0 ? 'accent' : '', { 'row-total': row.isTotal }]">
          {{ row.pending }}
        </span>
      </template>

      <template #cell-count="{ row }">
        <span :class="{ 'row-total': row.isTotal }">{{ row.count }}</span>
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import { useWorkerStore } from '@/stores/worker'
import { computed, onMounted } from 'vue'

const workerStore = useWorkerStore()

const headers = [
  { valueKey: 'year', title: 'Год' },
  { valueKey: 'used', title: 'Использовано', align: 'center' },
  { valueKey: 'free', title: 'Осталось', align: 'center' },
  { valueKey: 'pending', title: 'Ожидает', align: 'center' },
  { valueKey: 'count', title: 'Заявок', align: 'center' },
]

const rows = computed(() => {
  if (!workerStore.vacationYearlyStats.length) return []

  return [
    ...workerStore.vacationYearlyStats,
    { ...workerStore.vacationYearlyTotals, year: 'total', isTotal: true },
  ]
})

onMounted(workerStore.loadVacationYearlyStats)
</script>

<style scoped>
.worker-vacation {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.row-total {
  font-weight: 700;
}

.success {
  color: var(--success);
  font-weight: 600;
}
.warn {
  color: var(--warn);
  font-weight: 600;
}
.accent {
  color: var(--accent);
  font-weight: 600;
}
</style>
