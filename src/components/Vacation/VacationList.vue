<template>
  <div class="vacation-list">
    <div class="vacation-list__controls">
      <template v-if="isAdmin">
        <Tabs
          :tabs="targets"
          v-model="vacationStore.target"
          type="line"
          class="target-tabs"
        />
      </template>

      <template v-if="!isMobile">
        <Tabs :tabs="filters" v-model="vacationStore.filter" type="line" />
        <SelectUI
          variant="line"
          align="center"
          :options="years"
          v-model="vacationStore.selectedYear"
        />
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
    </div>

    <!-- Фильтры на мобилке — выезжающая панель, как боковое меню, вместо
    попыток впихнуть все селекты в одну строку с табами. -->
    <MobileFilterDrawer v-model="filtersOpen">
      <SelectUI
        label="Статус"
        full-width
        value-key="id"
        label-key="label"
        :options="filters"
        v-model="vacationStore.filter"
      />
      <SelectUI
        label="Год"
        full-width
        :options="years"
        v-model="vacationStore.selectedYear"
      />
    </MobileFilterDrawer>
    <table class="vacation-list__items">
      <tbody>
        <template
          v-if="
            !vacationStore.isLoading && vacationStore.filterVacations.length > 0
          "
          v-for="item in vacationStore.filterVacations"
        >
          <VacationItem
            :item="item"
            :is-admin="vacationStore.target == 'all'"
          />
        </template>
        <template v-else-if="!vacationStore.isLoading">
          <tr>
            <td class="vacation-item__empty">
              <span>Заявки не найдены</span>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr>
            <td class="vacation-item__empty">
              <LoaderTitle />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import MobileFilterDrawer from '@/components/MobileFilterDrawer.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { useThemeStore } from '@/stores/themes.js'
import { useUserStore } from '@/stores/user.js'
import { useVacationStore } from '@/stores/vacation'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import VacationItem from './VacationItem.vue'

const vacationStore = useVacationStore()
const userStore = useUserStore()
const { isMobile } = storeToRefs(useThemeStore())

const filtersOpen = ref(false)

// vacation.all:read теперь сужен до админов/руководителей (виджет "отпуска
// коллег" использует отдельное узкое vacation_calendar:read, см.
// stores/vacationOther.js) — поэтому вкладку "Все заявки" можно гейтить
// именно им, а не vacation.all:edit: сама вкладка — просмотр, а не
// изменение (approve/reject — отдельные действия внутри VacationItem.vue,
// у них свой gate на .edit). GET /vacation/all/:year на бэке и так требует
// ровно vacation.all:read (RequireAll), см. internal/vacation/route.go.
const isAdmin = computed(() => userStore.hasPermission('vacation.all', 'read'))

const targets = [
  { id: 'my', label: 'Мои заявки' },
  { id: 'all', label: 'Все заявки' },
]

const filters = [
  { id: 'all', label: 'Все' },
  {
    id: 'approved',
    label: 'Утвержденные',
    colors: {
      text: 'var(--success)',
      activeText: 'var(--success)',
      activeBackground: 'var(--muted-success)',
    },
  },
  {
    id: 'pending',
    label: 'На рассмотрении',
    colors: {
      text: 'var(--warn)',
      activeText: 'var(--warn)',
      activeBackground: 'var(--muted-warn)',
    },
  },
  {
    id: 'rejected',
    label: 'Отклоненные',
    colors: {
      text: 'var(--destructive)',
      activeText: 'var(--destructive)',
      activeBackground: 'var(--muted-destructive)',
    },
  },
]

const years = [
  vacationStore.selectedYear - 1,
  vacationStore.selectedYear,
  vacationStore.selectedYear + 1,
]
</script>

<style scoped>
.vacation-list {
  flex: 1;

  display: flex;
  flex-direction: column;

  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);

  padding: var(--padding-secondary);

  height: 100%;
}

.vacation-list__controls {
  display: flex;
  align-items: flex-end;
  gap: 2rem;
  border-bottom: 0.07rem solid var(--border-color);
}

.vacation-list__items {
  border-collapse: collapse;
}

.vacation-item__empty {
  padding: var(--padding-secondary);
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  color: var(--muted-text);
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
  .vacation-list__controls {
    align-items: center;
    padding-bottom: var(--gap-primary);
    gap: var(--gap-primary);
    border-bottom: none;
  }

  .target-tabs {
    flex: 1;
    min-width: 0;
  }

  .target-tabs :deep(.tabs-item) {
    flex: 1;
    justify-content: center;
  }
}
</style>
