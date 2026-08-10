<template>
  <div class="container">
    <VacationApplications v-if="submenuStore.activeTab === 'vacation-applications'" />
  </div>
</template>
<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import VacationApplications from '@/components/Document/VacationList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Документы', 'Файлы и заявления сотрудников')

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
const submenuStore = useSubmenuStore()
submenuStore.setItems([
  { id: 'vacation-applications', label: 'Заявления на отпуск' },
])
submenuStore.setActiveTab('vacation-applications')
</script>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
</style>
