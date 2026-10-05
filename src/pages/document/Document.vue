<template>
  <div class="container">
    <VacationApplications v-if="submenuStore.activeTab === 'vacation-applications'" />
    <ApplicationTemplates v-else-if="submenuStore.activeTab === 'application-templates'" />
  </div>
</template>
<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import ApplicationTemplates from '@/components/Document/ApplicationTemplates.vue'
import VacationApplications from '@/components/Document/VacationList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Документы', 'Файлы и заявления сотрудников')

// Заголовок и вкладки выставляем при каждой смене адреса: на /docs и
// /docs?template=... один и тот же экземпляр страницы, а router.beforeEach
// сбрасывает сабменю на каждой навигации
const route = useRoute()
const submenuStore = useSubmenuStore()

watch(
  () => route.fullPath,
  () => {
    if (route.name !== 'docs') return
    submenuStore.setItems([
      { id: 'vacation-applications', label: 'Заявления на отпуск' },
      { id: 'application-templates', label: 'Шаблоны заявлений' },
    ])
    submenuStore.setActiveTab(
      route.query.template ? 'application-templates' : 'vacation-applications'
    )
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
</style>
