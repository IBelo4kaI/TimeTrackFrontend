<template>
  <div class="container">
    <div class="report-controls">
      <ControlsCalendar
        :store="reportStore"
        :is-show-selecting-user="!canViewAll"
      />
    </div>

    <template v-if="!canViewAll">
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
    </template>

    <AppTable
      v-else
      :headers="allUsersHeaders"
      :rows="filteredRows"
      :loading="reportStore.isLoadingAll"
      row-key="id"
    >
      <template #toolbar>
        <span class="table-title">Статистика по сотрудникам</span>
        <SelectUI
          v-model="selectedDepartment"
          :options="departmentOptions"
          placeholder="Все отделы"
        />
      </template>

      <template #cell-totalHours="{ value, row }">
        <span :class="hoursVariant(row)">{{ value }}</span>
      </template>

      <template #cell-totalWorkDays="{ value }">
        <span class="success">{{ value }}</span>
      </template>

      <template #cell-medicalDays="{ value }">
        <span :class="value > 0 ? 'destructive' : ''">{{ value }}</span>
      </template>

      <template #cell-timeoffDays="{ value }">
        <span :class="value > 0 ? 'accent' : ''">{{ value }}</span>
      </template>

      <template #cell-vacationDays="{ value }">
        <span :class="value > 0 ? 'warn' : ''">{{ value }}</span>
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import SelectUI from '@/components/SelectUI.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useReportStore } from '@/stores/report'
import { useUserStore } from '@/stores/user'
import { computed, onMounted, ref, watch } from 'vue'
import CardStatistic from './components/CardStatistic.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Табель', 'Детальный учёт времени')

const reportStore = useReportStore()
const userStore = useUserStore()

const canViewAll = computed(() => userStore.hasPermission('report.all', 'read'))

// --- All users table ---

const selectedDepartment = ref('all')

const departmentOptions = computed(() => [
  { label: 'Все отделы', value: 'all' },
  ...reportStore.departments.map((d) => ({ label: d, value: d })),
])

const filteredRows = computed(() => {
  if (selectedDepartment.value === 'all') return reportStore.allUsersStatistics
  return reportStore.allUsersStatistics.filter(
    (r) => r.department === selectedDepartment.value
  )
})

const allUsersHeaders = [
  { valueKey: 'name', title: 'Сотрудник' },
  { valueKey: 'department', title: 'Отдел' },
  { valueKey: 'standardHours', title: 'Норма ч', align: 'center' },
  { valueKey: 'totalHours', title: 'Отработано ч', align: 'center' },
  { valueKey: 'standardWorkDays', title: 'Норма д', align: 'center' },
  { valueKey: 'totalWorkDays', title: 'Отработано д', align: 'center' },
  { valueKey: 'medicalDays', title: 'Больничные', align: 'center' },
  { valueKey: 'timeoffDays', title: 'Отгулы', align: 'center' },
  { valueKey: 'vacationDays', title: 'Отпуск', align: 'center' },
  { valueKey: 'decreeDays', title: 'Декрет', align: 'center' },
]

const hoursVariant = (row) => {
  if (row.totalHours >= row.standardHours) return 'success'
  if (row.totalHours > 0) return 'warn'
  return ''
}

// --- Personal statistics (for users without report.all) ---

const workingProcess = computed(() =>
  percent(
    reportStore.workingHours.totalHours,
    reportStore.workingHours.standardHours
  )
)

const percent = (num, all) => Math.abs((num / all) * 100)

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
  if (canViewAll.value) {
    await reportStore.fetchAllStatistics()
  } else {
    await reportStore.init()
  }
})

watch(
  () => reportStore.currentDate,
  async () => {
    if (canViewAll.value) {
      await reportStore.fetchAllStatistics()
    }
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

.report-statistic {
  display: flex;
  flex-wrap: wrap;
  gap: var(--padding-primary);
  width: 100%;
}

.report-statistic > * {
  flex: 1;
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.success {
  color: var(--success);
  font-weight: 600;
}

.warn {
  color: var(--warn);
  font-weight: 600;
}

.destructive {
  color: var(--destructive);
  font-weight: 600;
}

.accent {
  color: var(--accent);
  font-weight: 600;
}
</style>
