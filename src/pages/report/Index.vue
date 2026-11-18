<template>
  <div class="container">
    <div class="report-controls">
      <ControlsCalendar :store="reportStore" :is-show-selecting-user="false" page="report" />
    </div>

    <div v-if="reportStore.loadError" class="report-error" role="alert">
      <span>{{ reportStore.loadError }}</span>
      <ButtonUI type="muted" @click="reportStore.fetchAllStatistics">Обновить</ButtonUI>
    </div>
    <div v-else-if="!reportStore.isLoadingAll" class="approval-summary" aria-label="Сводка подтверждения табелей">
      <div class="summary-item"><span>Сотрудников</span><strong>{{ departmentRows.length }}</strong></div>
      <div v-for="(meta, status) in TIMESHEET_STATUSES" :key="status" class="summary-item">
        <span>{{ meta.label }}</span><strong>{{ statusCounts[status] }}</strong>
      </div>
      <div class="approval-progress">
        <span>Подтверждено {{ statusCounts.approved }} из {{ departmentRows.length }}</span>
        <progress :value="statusCounts.approved" :max="departmentRows.length || 1" aria-label="Доля подтверждённых табелей" />
      </div>
    </div>

    <ReportTable
      v-model="selectedDepartment"
      v-model:status="selectedStatus"
      :rows="filteredRows"
      :is-loading="reportStore.isLoadingAll"
      :departments="reportStore.departments"
    />
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import ReportTable from '@/components/Report/ReportTable.vue'
import { TIMESHEET_STATUSES } from '@/constants/timesheet.constants'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useReportStore } from '@/stores/report'
import { computed, onMounted, ref, watch } from 'vue'

useHeaderTitleStore().setTitle('Табель', 'Сводная статистика по сотрудникам')
const reportStore = useReportStore()
const selectedDepartment = ref('all')
const selectedStatus = ref('all')

const departmentRows = computed(() => selectedDepartment.value === 'all'
  ? reportStore.allUsersStatistics
  : reportStore.allUsersStatistics.filter((row) => row.department === selectedDepartment.value))
const filteredRows = computed(() => selectedStatus.value === 'all'
  ? departmentRows.value
  : departmentRows.value.filter((row) => row.status === selectedStatus.value))
const statusCounts = computed(() => {
  const counts = { pending: 0, approved: 0, needs_review: 0 }
  departmentRows.value.forEach((row) => { if (row.status in counts) counts[row.status]++ })
  return counts
})

watch(() => reportStore.isLoadingAll, (loading) => {
  if (!loading && selectedDepartment.value !== 'all' && !reportStore.departments.includes(selectedDepartment.value)) {
    selectedDepartment.value = 'all'
  }
})
onMounted(() => reportStore.fetchAllStatistics())
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
.approval-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--gap-primary);
  padding: var(--padding-primary);
  background: var(--foreground);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
.summary-item { display: flex; flex-direction: column; gap: .5rem; }
.summary-item span, .approval-progress { color: var(--muted-text); font-size: .9rem; }
.summary-item strong { font-size: 1.5rem; color: var(--text); }
.approval-progress { grid-column: 1 / -1; display: flex; align-items: center; gap: var(--gap-primary); }
progress { flex: 1; min-width: 0; height: .5rem; accent-color: var(--success); }
.report-error { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: var(--padding-primary); color: var(--destructive); }
@media (max-width: 768px) { .approval-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media print {
  .report-controls, .report-error { display: none !important; }
}
</style>
