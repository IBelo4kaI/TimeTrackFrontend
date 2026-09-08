<template>
  <div class="filters">
    <div class="toggle">
      <Tabs :tabs="viewModeTabs" v-model="store.filters.viewMode" />
    </div>

    <template v-if="!isMobile">
      <SelectUI
        v-if="isReadAllDep"
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
    </template>

    <button
      v-else
      type="button"
      class="filter-trigger"
      @click="filtersOpen = true"
      aria-label="Фильтры"
    >
      <i class="fa-regular fa-filter"></i>
    </button>

    <MobileFilterDrawer v-model="filtersOpen">
      <SelectUI
        v-if="isReadAllDep"
        label="Отдел"
        full-width
        v-model="store.filters.department"
        @change="store.updateFilters({ department: store.filters.department })"
        :options="departmentOptions"
      />

      <SelectUI
        label="Статус"
        full-width
        v-model="store.filters.status"
        @change="store.updateFilters({ status: store.filters.status })"
        :options="statusOptions"
      />

      <SelectUI
        label="Месяц"
        full-width
        v-model="store.filters.month"
        @change="store.updateFilters({ month: store.filters.month })"
        :options="monthOptions"
      />

      <SelectUI
        label="Год"
        full-width
        v-model="store.filters.year"
        @change="store.updateFilters({ year: store.filters.year })"
        :options="yearOptions"
      />

      <ButtonUI v-if="activeCount" type="muted" @click="store.resetFilters">
        Сбросить
      </ButtonUI>
      <ButtonUI @click="store.initialFetch">Обновить</ButtonUI>
    </MobileFilterDrawer>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import MobileFilterDrawer from '@/components/MobileFilterDrawer.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { MONTH_NAMES } from '@/constants/calendar.constants'
import { useThemeStore } from '@/stores/themes'
import { useUserStore } from '@/stores/user'
import { useVacationOther } from '@/stores/vacationOther'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const store = useVacationOther()
const userStore = useUserStore()
const { isMobile } = storeToRefs(useThemeStore())
const filtersOpen = ref(false)
// Тот же признак "видит все отделы", что и в store.allEmployeesFlat.
const isReadAllDep =
  userStore.hasPermission('vacation.all', 'edit') ||
  userStore.hasPermission('vacation.all', 'read')

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

const departmentOptions = computed(() => [
  { label: 'Все', value: 'all' },
  ...store.departments.map((d) => {
    return { label: d, value: d }
  }),
])

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

.filter-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--background);
  color: var(--text);
  font-size: 1.14rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .toggle {
    flex: 1;
    min-width: 0;
  }

  .toggle :deep(.tabs-container) {
    width: 100%;
  }

  .toggle :deep(.tabs-item) {
    flex: 1;
    justify-content: center;
  }
}
</style>
