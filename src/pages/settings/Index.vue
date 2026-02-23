<template>
  <div class="container">
    <VacationSettings />
    <StandardSettings />
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import VacationSettings from './components/VacationSettings.vue'
import { useStandardSetting } from '@/stores/standardSetting'
import StandardSettings from './components/StandardSettings.vue'

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
