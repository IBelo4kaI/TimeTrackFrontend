<template>
  <div class="container">
    <VacationStats v-if="vacationStore.target !== 'all'" />
    <div class="container-row">
      <VacationList />
      <VacationCreate />
    </div>
    <VacationOther />
  </div>
</template>

<script setup>
import { useAddVacationModalStore } from '@/stores/addVacationModal'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { onMounted } from 'vue'
import VacationCreate from './components/VacationCreate.vue'
import VacationList from './components/VacationList.vue'
import VacationOther from './components/VacationOther/VacationOther.vue'
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

.container-row {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  align-items: flex-start;
}

@media (max-width: 768px) {
  .container {
  }

  .container-row {
    flex-wrap: wrap;
  }
}
</style>
