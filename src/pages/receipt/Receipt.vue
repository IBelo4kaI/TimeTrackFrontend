<template>
  <div class="container">
    <div class="back-row">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>
    </div>

    <ReceiptInfo
      v-if="submenuStore.activeTab === 'info'"
      :receipt="receipt"
      :is-loading="isLoading"
    />
    <ReceiptFiles
      v-else-if="submenuStore.activeTab === 'files'"
      :receipt-id="route.params.id"
      :receipt="receipt"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getReceiptById } from '@/services/receipt.api'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useNotificationStore } from '@/stores/notification'
import { useSubmenuStore } from '@/stores/submenu'
import ReceiptFiles from '@/components/Receipt/ReceiptView/ReceiptFiles.vue'
import ReceiptInfo from '@/components/Receipt/ReceiptView/ReceiptInfo.vue'

const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()

// «Назад» — на ту страницу, откуда реально пришли (список чеков), а не
// всегда на /receipts, как у vacation-application (pages/document/VacationApplication.vue).
function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'receipts' })
  }
}

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Чек', 'Информация о чеке')

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
const submenuStore = useSubmenuStore()
submenuStore.setItems([
  { id: 'info', label: 'Информация' },
  { id: 'files', label: 'Файлы' },
])
submenuStore.setActiveTab(route.query.tab === 'files' ? 'files' : 'info')

const receipt = ref(null)
const isLoading = ref(false)

async function load() {
  isLoading.value = true
  try {
    receipt.value = await getReceiptById(route.params.id)
  } catch (err) {
    receipt.value = null

    // Бэк отдаёт 403, если чек чужой и нет receipts.all:read — тост уже
    // показывает общий перехватчик в api.js, тут только уводим со сломанной
    // пустой страницы
    if (err?.response?.status === 403) {
      router.push({ name: 'receipts' })
      return
    }

    notificationStore.addNotification('Не удалось загрузить чек', 'error')
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
