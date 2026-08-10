<template>
  <div class="container">
    <div class="back-row">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>
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
import { useRoute, useRouter } from 'vue-router'
import { getVacationById } from '@/services/vacation.api'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useNotificationStore } from '@/stores/notification'
import { useSubmenuStore } from '@/stores/submenu'
import VacationApplicationFiles from '@/components/Document/VacationApplicationFiles.vue'
import VacationApplicationInfo from '@/components/Document/VacationApplicationInfo.vue'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

// «Назад» — на ту страницу, с которой реально пришли (список заявлений на
// /docs, строка отпуска на /vacation, и т.д.), а не всегда на /docs.
// window.history.state.back — это то, что Vue Router 4 сам пишет в History
// State при каждом push внутри SPA; если его нет (открыли страницу по
// прямой ссылке/обновили), откатываемся на список заявлений.
function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'docs' })
  }
}

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Заявление на отпуск', 'Информация по заявке')

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
// централизованно, до монтирования следующей страницы — здесь его дублировать
// не нужно.
// Начальная вкладка — из query (?tab=files), чтобы можно было вести сразу на
// файлы (например, из таблицы документов); по умолчанию — «Информация».
const submenuStore = useSubmenuStore()
submenuStore.setItems([
  { id: 'info', label: 'Информация' },
  { id: 'files', label: 'Файлы' },
])
submenuStore.setActiveTab(route.query.tab === 'files' ? 'files' : 'info')

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
  background: none;
  border: none;
  padding: 0;
  color: var(--muted-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent);
}
</style>
