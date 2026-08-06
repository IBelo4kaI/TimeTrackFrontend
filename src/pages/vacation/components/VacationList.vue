<template>
  <div class="vacation-list">
    <div class="vacation-list__controls">
      <template v-if="userStore.hasPermission('vacation.all', 'read')">
        <Tabs :tabs="targets" v-model="vacationStore.target" type="line" />
      </template>
      <Tabs
        :tabs="filters"
        v-model="vacationStore.filter"
        type="line"
        v-if="!isMobile"
      />
      <SelectUI
        v-if="isMobile"
        :variant="isMobile ? '' : 'line'"
        align="center"
        value-key="id"
        label-key="label"
        :options="filters"
        v-model="vacationStore.filter"
      />
      <SelectUI
        :variant="isMobile ? '' : 'line'"
        align="center"
        :options="years"
        v-model="vacationStore.selectedYear"
      />
    </div>
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
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { useThemeStore } from '@/stores/themes.js'
import { useUserStore } from '@/stores/user.js'
import { useVacationStore } from '@/stores/vacation'
import { storeToRefs } from 'pinia'
import VacationItem from './VacationItem.vue'

const vacationStore = useVacationStore()
const userStore = useUserStore()
const { isMobile } = storeToRefs(useThemeStore())

const targets = [
  { id: 'my', label: 'Мои заявки' },
  { id: 'all', label: 'Все заявки' },
]

const filters = [
  { id: 'all', label: 'Все' },
  { id: 'approved', label: 'Утвержденные' },
  { id: 'pending', label: 'На рассмотрении' },
  { id: 'rejected', label: 'Отклоненные' },
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

@media (max-width: 768px) {
  .vacation-list {
  }

  .vacation-list__controls {
    flex-wrap: wrap;
    padding-bottom: var(--gap-primary);
    gap: var(--gap-primary);
  }

  .vacation-list__items {
  }

  .vacation-item__empty {
  }
}
</style>
