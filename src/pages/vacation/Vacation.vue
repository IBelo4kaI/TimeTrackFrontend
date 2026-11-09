<template>
  <div class="container">
    <VacationStats v-if="submenuStore.activeTab === 'receipt'" />
    <div class="container-row">
      <VacationList />
    </div>
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import { useVacationStore } from '@/stores/vacation'
import { computed, watch } from 'vue'
import VacationList from '@/components/Vacation/VacationList.vue'
import VacationStats from '@/components/Vacation/VacationStats.vue'
import { useUserStore } from '@/stores/user'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Отпуска', 'Управление отпусками')

const userStore = useUserStore()
const submenuItems = computed(() => [
  { id: 'receipt', label: 'Заявки' },
  ...(userStore.hasPermission('vacation.all', 'read')
    ? [{ id: 'all_receipt', label: 'Все заявки' }]
    : []),
])

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
const submenuStore = useSubmenuStore()
submenuStore.setItems(submenuItems.value)
submenuStore.setActiveTab('receipt')

const vacationStore = useVacationStore()

watch(
  () => submenuStore.activeTab,
  (tab) => {
    const target = tab === 'all_receipt' ? 'all' : 'my'
    if (vacationStore.target !== target) vacationStore.target = target
    else vacationStore.fetchVacations()
  },
  { immediate: true }
)
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
