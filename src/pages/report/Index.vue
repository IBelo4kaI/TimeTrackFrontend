<template>
  <div class="container">
    <div class="report-controls">
      <ControlsCalendar :store="reportStore" :is-show-selecting-user="false" page="report" />
    </div>

    <ReportTable
      v-model="selectedDepartment"
      :rows="filteredRows"
      :is-loading="reportStore.isLoadingAll"
      :departments="reportStore.departments"
    />
  </div>
</template>

<script setup>
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useReportStore } from '@/stores/report'
import { computed, onMounted, ref, watch } from 'vue'
import ReportTable from '@/components/Report/ReportTable.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Табель', 'Сводная статистика по сотрудникам')

const reportStore = useReportStore()

// Страница доступна только с calendar.all:read (см. router/index.js) — это
// всегда сводная таблица по всем сотрудникам, личная статистика переехала
// на карточку сотрудника (/home → вкладка «Табель»).

const selectedDepartment = ref('all')

const filteredRows = computed(() => {
  if (selectedDepartment.value === 'all') return reportStore.allUsersStatistics
  return reportStore.allUsersStatistics.filter(
    (r) => r.department === selectedDepartment.value
  )
})

onMounted(async () => {
  await reportStore.fetchAllStatistics()
})

watch(
  () => reportStore.currentDate,
  async () => {
    await reportStore.fetchAllStatistics()
  }
)
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}

@media print {
  .report-controls {
    display: none !important;
  }
}
</style>
