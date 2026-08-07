<template>
  <div class="container">
    <VacationStats v-if="vacationStore.target !== 'all'" />
    <div class="container-row" v-if="submenuStore.activeTab == 'receipt'">
      <VacationList />
      <VacationCreate />
    </div>
    <VacationOther v-else-if="submenuStore.activeTab == 'other'" />
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import { useVacationStore } from '@/stores/vacation'
import { onMounted, onUnmounted } from 'vue'
import VacationCreate from './components/VacationCreate.vue'
import VacationList from './components/VacationList.vue'
import VacationOther from './components/VacationOther/VacationOther.vue'
import VacationStats from './components/VacationStats.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Отпуска', 'Управление отпусками')

const submenuStore = useSubmenuStore()
submenuStore.setItems([
  { id: 'receipt', label: 'Заявки' },
  { id: 'other', label: 'Отпуска других сотрудников' },
])
submenuStore.setActiveTab('receipt')

const vacationStore = useVacationStore()

onMounted(async () => {
  await vacationStore.fetchVacations()
})
onUnmounted(() => {
  submenuStore.reset()
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
