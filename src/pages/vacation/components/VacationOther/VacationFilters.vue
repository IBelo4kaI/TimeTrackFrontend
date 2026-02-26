<template>
  <div class="filters">
    <div class="toggle">
      <Tabs :tabs="viewModeTabs" v-model="store.filters.viewMode" />
    </div>

    <SelectUI
      v-model="store.filters.department"
      @change="store.updateFilters({ department: store.filters.department })"
      :options="departmentOptions"
    />

    <SelectUI
      v-model="store.filters.status"
      @change="store.updateFilters({ status: store.filters.status })"
      :options="statusOptions"
    />

    <SelectUI
      v-model="store.filters.month"
      @change="store.updateFilters({ month: store.filters.month })"
      :options="monthOptions"
    />

    <SelectUI
      v-model="store.filters.year"
      @change="store.updateFilters({ year: store.filters.year })"
      :options="yearOptions"
    />

    <ButtonUI v-if="activeCount" @click="store.resetFilters">Сбросить</ButtonUI>
    <ButtonUI @click="store.initialFetch">Обновить</ButtonUI>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { MONTH_NAMES } from '@/constants/calendar.constants'
import { useVacationOther } from '@/stores/vacationOther'
import { computed } from 'vue'

const store = useVacationOther()

const activeCount = computed(() => {
  return [
    store.filters.department !== 'all',
    store.filters.status !== 'all',
  ].filter(Boolean).length
})

const viewModeTabs = [
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
]

const departmentOptions = [
  { label: 'Все', value: 'all' },
  ...store.departments.map((d) => {
    return { label: d, value: d }
  }),
]

const statusOptions = [
  { label: 'Все статусы', value: 'all' },
  { label: 'На рассмотрении', value: 'pending' },
  { label: 'Утвержденные', value: 'approved' },
  { label: 'Отклоненные', value: 'rejected' },
]

const monthOptions = [
  ...MONTH_NAMES.map((v, i) => {
    return { label: v, value: i + 1 }
  }),
]

const yearOptions = computed(() => {
  const date = new Date()
  return [date.getFullYear() - 1, date.getFullYear(), date.getFullYear() + 1]
})
</script>

<style scoped>
.filters {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  flex-wrap: wrap;
}
</style>
