<template>
  <div class="container">
    <Loader v-if="vacationStore.isLoading" />
    <template v-else>
      <VacationStats />
      <div class="vacation-list-header">
        <div class="vacation-list-title">Заявки на отпуск</div>
        <div class="vacation-list-filter">
          <template v-if="userStore.hasPermission('vacation.all', 'read')">
            <Tabs
              :tabs="targets"
              v-model="vacationStore.target"
              type="accent"
            />
          </template>
          <Tabs :tabs="filters" v-model="vacationStore.filter" type="accent" />
        </div>
        <div class="vacation-list-year">
          <SelectUI :options="years" v-model="vacationStore.selectedYear" />
        </div>
        <div class="vacation-list-new">
          <ButtonUI
            @click="addVacationModalStore.open(vacationStore.target == 'all')"
          >
            Создать заявку
          </ButtonUI>
        </div>
      </div>
      <VacationList
        :items="vacationStore.filterVacations"
        :is-admin="vacationStore.target == 'all'"
      />
    </template>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import Loader from '@/components/Loader.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { useAddVacationModalStore } from '@/stores/addVacationModal'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { onMounted } from 'vue'
import VacationList from './components/VacationList.vue'
import VacationStats from './components/VacationStats.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Отпуска', 'Управление отпусками')

const userStore = useUserStore()

const addVacationModalStore = useAddVacationModalStore()

const vacationStore = useVacationStore()

const years = [
  vacationStore.selectedYear - 1,
  vacationStore.selectedYear,
  vacationStore.selectedYear + 1,
]

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

onMounted(async () => {
  await vacationStore.fetchVacations()
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
.vacation-action {
  display: flex;
  gap: 0.71rem;
  justify-content: space-between;
}
.vacation-stats {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  justify-content: space-between;
}
.vacation-list-header {
  display: flex;
  justify-content: space-between;
  gap: calc(var(--padding-secondary) / 2);
  align-items: center;
  height: 3rem;
}
.vacation-list-title {
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
.vacation-list-filter {
  flex: 1;
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
}
.vacation-list-year {
}

.vacation-list-items {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
}
</style>
