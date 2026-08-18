<template>
  <div class="container">
    <div class="back-row">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>
    </div>

    <LoaderTitle v-if="workerStore.isLoading && !workerStore.isLoaded" />

    <div v-else-if="!workerStore.profile" class="not-found">
      Сотрудник не найден
    </div>

    <template v-else>
      <WorkerHome v-if="submenuStore.activeTab === 'home'" />
      <WorkerReport v-else-if="submenuStore.activeTab === 'report'" />
      <WorkerVacation v-else-if="submenuStore.activeTab === 'vacation'" />

      <!-- Больничные — следующим шагом, пока заглушка -->
      <div v-else class="tab-placeholder">
        <i class="fa-regular fa-hammer"></i>
        <span>Раздел «{{ activeTabLabel }}» скоро появится</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import WorkerHome from '@/components/Workers/WorkerHome.vue'
import WorkerReport from '@/components/Workers/WorkerReport.vue'
import WorkerVacation from '@/components/Workers/WorkerVacation.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import { useWorkerStore } from '@/stores/worker'

const route = useRoute()
const router = useRouter()

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Карточка сотрудника', 'Сводная информация')

// Страница открывается только по клику из общей таблицы табеля
// (Report/ReportTable.vue), в сайдбаре пункта нет — как и у
// vacation-application. «Назад» — туда, откуда реально пришли, иначе на
// табель.
function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'report' })
  }
}

const TABS = [
  { id: 'home', label: 'Главная' },
  { id: 'report', label: 'Табель' },
  { id: 'vacation', label: 'Отпуска' },
  { id: 'sick-leave', label: 'Больничные' },
]

const submenuStore = useSubmenuStore()
submenuStore.setItems(TABS)
submenuStore.setActiveTab('home')

const activeTabLabel = computed(
  () => TABS.find((t) => t.id === submenuStore.activeTab)?.label ?? ''
)

const workerStore = useWorkerStore()

async function load() {
  await workerStore.load(route.params.id)
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

.not-found,
.tab-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.71rem;
  padding: 4rem 1rem;
  color: var(--muted-text);
  font-size: 1rem;
}

.tab-placeholder i {
  font-size: 1.5rem;
}
</style>
