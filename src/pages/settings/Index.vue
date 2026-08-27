<template>
  <div class="container">
    <template v-if="submenuStore.activeTab === 'vacation'">
      <VacationSettings />
      <VacationTypeSettings />
    </template>
    <StandardSettings v-else-if="submenuStore.activeTab === 'standards'" />
    <template v-else-if="submenuStore.activeTab === 'notifications'">
      <NotificationSettings />
      <TimesheetReminderCard />
    </template>
    <CalendarEventsList v-else-if="submenuStore.activeTab === 'calendar'" />
  </div>
</template>

<script setup>
import CalendarEventsList from '@/components/Settings/CalendarEvents/CalendarEventsList.vue'
import NotificationSettings from '@/components/Settings/NotificationSettings.vue'
import StandardSettings from '@/components/Settings/StandardSettings.vue'
import TimesheetReminderCard from '@/components/Settings/TimesheetReminderCard.vue'
import VacationSettings from '@/components/Settings/VacationSettings.vue'
import VacationTypeSettings from '@/components/Settings/VacationTypeSettings.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useStandardSetting } from '@/stores/standardSetting'
import { useSubmenuStore } from '@/stores/submenu'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Настройки', 'Конфигурация системы')

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
const submenuStore = useSubmenuStore()
submenuStore.setItems([
  { id: 'vacation', label: 'Отпуска' },
  { id: 'standards', label: 'Нормативы' },
  { id: 'notifications', label: 'Уведомления' },
  { id: 'calendar', label: 'Календарь' },
])
submenuStore.setActiveTab('vacation')

const standardSetting = useStandardSetting()
standardSetting.initialFetch()
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
</style>
