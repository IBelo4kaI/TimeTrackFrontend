<template>
  <div class="container">
    <VacationSettings />
    <StandardSettings />
    <NotificationSettings />
    <CalendarEventsList />
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import VacationSettings from '@/components/Settings/VacationSettings.vue'
import { useStandardSetting } from '@/stores/standardSetting'
import StandardSettings from '@/components/Settings/StandardSettings.vue'
import NotificationSettings from '@/components/Settings/NotificationSettings.vue'
import CalendarEventsList from '@/components/Settings/CalendarEvents/CalendarEventsList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Настройки', 'Конфигурация системы')
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
