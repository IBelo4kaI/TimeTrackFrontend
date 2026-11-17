<template>
  <div class="container">
    <VacationStats v-if="submenuStore.activeTab === 'receipt'" />
    <div class="container-row">
      <VacationBalance v-if="submenuStore.activeTab === 'balance' && canReadBalance" />
      <VacationList v-else-if="submenuStore.activeTab !== 'balance'" />
    </div>
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import { useVacationStore } from '@/stores/vacation'
import { computed, watch } from 'vue'
import VacationBalance from '@/components/Vacation/VacationBalance.vue'
import VacationList from '@/components/Vacation/VacationList.vue'
import VacationStats from '@/components/Vacation/VacationStats.vue'
import { useUserStore } from '@/stores/user'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Отпуска', 'Управление отпусками')

const userStore = useUserStore()
const canReadBalance = computed(() => userStore.hasPermission('vacation.all', 'read'))
const canReadOwn = computed(() => userStore.hasPermission('vacation', 'read'))
const submenuItems = computed(() => [
  ...(canReadOwn.value ? [{ id: 'receipt', label: 'Заявки' }] : []),
  ...(userStore.hasPermission('department.manager', 'manage')
    ? [{ id: 'department_receipt', label: 'Заявки отдела' }]
    : []),
  ...(canReadBalance.value
    ? [{ id: 'all_receipt', label: 'Все заявки' }, { id: 'balance', label: 'Баланс отпусков' }]
    : []),
])

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
const submenuStore = useSubmenuStore()
submenuStore.setItems(submenuItems.value)
submenuStore.setActiveTab(canReadOwn.value ? 'receipt' : 'department_receipt')

watch(submenuItems, (items) => {
  submenuStore.setItems(items)
  if (!items.some((item) => item.id === submenuStore.activeTab)) {
    submenuStore.setActiveTab(canReadOwn.value ? 'receipt' : 'department_receipt')
  }
}, { flush: 'sync' })

const vacationStore = useVacationStore()

watch(
  () => submenuStore.activeTab,
  (tab) => {
    if (tab === 'balance') return
    const target = tab === 'all_receipt' ? 'all' : tab === 'department_receipt' ? 'department' : 'my'
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
