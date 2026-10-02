<template>
  <div class="container">
    <VacationApplications v-if="submenuStore.activeTab === 'vacation-applications'" />
    <ApplicationTemplates v-else-if="submenuStore.activeTab === 'application-templates'" />
  </div>
</template>
<script setup>
import { useRoute } from 'vue-router'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import ApplicationTemplates from '@/components/Document/ApplicationTemplates.vue'
import VacationApplications from '@/components/Document/VacationList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Документы', 'Файлы и заявления сотрудников')

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
const submenuStore = useSubmenuStore()
submenuStore.setItems([
  { id: 'vacation-applications', label: 'Заявления на отпуск' },
  { id: 'application-templates', label: 'Шаблоны заявлений' },
])
submenuStore.setActiveTab(
  useRoute().query.template ? 'application-templates' : 'vacation-applications'
)
</script>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
</style>
