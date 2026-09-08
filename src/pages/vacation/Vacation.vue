<template>
  <div class="container">
    <VacationStats
      v-if="submenuStore.activeTab === 'receipt' && vacationStore.target !== 'all'"
    />
    <div class="container-row" v-if="submenuStore.activeTab == 'receipt'">
      <VacationList />
      <VacationCreate v-if="!isMobile" />
    </div>
    <VacationCreate v-else-if="submenuStore.activeTab == 'create'" />
    <VacationOther v-else-if="submenuStore.activeTab == 'other'" />
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import { useThemeStore } from '@/stores/themes'
import { useVacationStore } from '@/stores/vacation'
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import VacationCreate from '@/components/Vacation/VacationCreate.vue'
import VacationList from '@/components/Vacation/VacationList.vue'
import VacationOther from '@/components/Vacation/VacationOther/VacationOther.vue'
import VacationStats from '@/components/Vacation/VacationStats.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Отпуска', 'Управление отпусками')

const { isMobile } = storeToRefs(useThemeStore())

// На мобилке форма создания рядом со списком не помещается — переносим её в
// отдельную вкладку; на десктопе всё как раньше, бок о бок со списком.
function buildSubmenuItems() {
  const items = [{ id: 'receipt', label: 'Заявки' }]
  if (isMobile.value) items.push({ id: 'create', label: 'Создать' })
  items.push({ id: 'other', label: 'Отпуска других сотрудников' })
  return items
}

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
const submenuStore = useSubmenuStore()
submenuStore.setItems(buildSubmenuItems())
submenuStore.setActiveTab('receipt')

watch(isMobile, () => {
  submenuStore.setItems(buildSubmenuItems())
  // вкладки "create" на десктопе нет — уводим со сломанной вкладки на список
  if (!isMobile.value && submenuStore.activeTab === 'create') {
    submenuStore.setActiveTab('receipt')
  }
})

const vacationStore = useVacationStore()

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
