<template>
  <div class="container">
    <div class="back-row">
      <RouterLink :to="{ name: 'docs' }" class="back-link">
        <i class="fa-regular fa-arrow-left"></i>
        К списку заявлений
      </RouterLink>
    </div>

    <VacationApplicationInfo
      v-if="submenuStore.activeTab === 'info'"
      :vacation="vacation"
      :is-loading="isLoading"
      @changed="load"
    />
    <VacationApplicationFiles
      v-else-if="submenuStore.activeTab === 'files'"
      :vacation-id="route.params.id"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getVacationById } from '@/services/vacation.api'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useNotificationStore } from '@/stores/notification'
import { useSubmenuStore } from '@/stores/submenu'
import VacationApplicationFiles from '@/components/Document/VacationApplicationFiles.vue'
import VacationApplicationInfo from '@/components/Document/VacationApplicationInfo.vue'

const route = useRoute()
const notificationStore = useNotificationStore()

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Заявление на отпуск', 'Информация по заявке')

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
const submenuStore = useSubmenuStore()
submenuStore.setItems([
  { id: 'info', label: 'Информация' },
  { id: 'files', label: 'Файлы' },
])
submenuStore.setActiveTab('info')

const vacation = ref(null)
const isLoading = ref(false)

async function load() {
  isLoading.value = true
  try {
    vacation.value = await getVacationById(route.params.id)
  } catch {
    vacation.value = null
    notificationStore.addNotification(
      'Не удалось загрузить заявку на отпуск',
      'error'
    )
  } finally {
    isLoading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}

.back-row {
  display: flex;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--muted-text);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent);
}
</style>
