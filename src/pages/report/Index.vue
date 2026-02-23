<template>
  <div class="container">
    <div class="report-controls">
      <ControlsCalendar :store="reportStore" page="" />
    </div>
    <div class="report-statistic">
      <!-- Рабочее время -->
      <CardStatistic
        title="Рабочее время"
        icon="⏱️"
        icon-variant="primary"
        :rows="workingHoursRows"
        :show-progress="true"
        :progress-percent="workingProcess"
        progress-label="Выполнено"
        progress-variant="success"
        :is-loading="reportStore.isLoading"
        :hoverable="false"
        @click="handleCardClick('working-hours')"
      />

      <!-- Рабочие дни -->
      <CardStatistic
        title="Рабочие дни"
        icon="📅"
        icon-variant="success"
        :rows="workingDaysRows"
        :is-loading="reportStore.isLoading"
        :hoverable="false"
        @click="handleCardClick('working-days')"
      />

      <!-- Прочие отсутствия -->
      <CardStatistic
        title="Прочие отсутствия"
        icon="📋"
        icon-variant="destructive"
        :rows="absencesRows"
        :show-progress="false"
        :is-loading="reportStore.isLoading"
        :hoverable="false"
        @click="handleCardClick('absences')"
      />
    </div>
  </div>
</template>

<script setup>
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useReportStore } from '@/stores/report'
import { computed, onMounted, ref } from 'vue'
import CardStatistic from './components/CardStatistic.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Табель', 'Детальный учёт времени')

const reportStore = useReportStore()

const workingProcess = computed(() =>
  percent(
    reportStore.workingHours.totalHours,
    reportStore.workingHours.standardHours
  )
)

const percent = (num, all) => {
  return Math.abs((num / all) * 100)
}

const workingHoursRows = computed(() => [
  {
    label: 'Норма часов',
    value: `${reportStore.workingHours.standardHours} ч`,
  },
  {
    label: 'Отработано',
    value: `${reportStore.workingHours.totalHours} ч`,
    valueVariant: 'success',
  },
])

const workingDaysRows = computed(() => [
  {
    label: 'Норма дней',
    value: `${reportStore.workingDays.standardWorkDays} д`,
  },
  {
    label: 'Отработано',
    value: `${reportStore.workingDays.totalWorkDays} д`,
    valueVariant: 'success',
  },
])

const absencesRows = computed(() => [
  {
    label: 'Больничные',
    value: `${reportStore.otherDays.medicalDays.count} д`,
    valueVariant: 'destructive',
  },
  {
    label: 'Отгулы',
    value: `${reportStore.otherDays.timeoffDays.count} д`,
    valueVariant: 'accent',
  },
  {
    label: 'Отпускные',
    value: `${reportStore.otherDays.vacationDays.count} д`,
    valueVariant: 'warn',
  },
  { label: 'Декретные', value: `${reportStore.otherDays.decreeDays.count} д` },
])

const handleCardClick = (a) => {}

onMounted(async () => {
  await reportStore.init()
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}

.report-statistic {
  display: flex;
  flex-wrap: wrap;
  gap: var(--padding-primary);
  width: 100%;
}

.report-statistic > * {
  flex: 1;
}
</style>
