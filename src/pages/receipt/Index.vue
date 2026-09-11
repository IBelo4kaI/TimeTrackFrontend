<template>
  <div class="container">
    <div class="container-row" v-if="submenuStore.activeTab == 'receipt'">
      <ReceiptList />
      <ReceiptCreate v-if="!isMobile" />
    </div>
    <ReceiptCreate v-else-if="submenuStore.activeTab == 'create'" />
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import { useThemeStore } from '@/stores/themes'
import { useReceiptStore } from '@/stores/receipt'
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import ReceiptCreate from '@/components/Receipt/ReceiptCreate.vue'
import ReceiptList from '@/components/Receipt/ReceiptList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Чеки', 'Учёт расходов по чекам')

const { isMobile } = storeToRefs(useThemeStore())

// как у vacation (pages/vacation/Vacation.vue): на мобилке форма создания
// не помещается рядом со списком — отдельная вкладка; на десктопе бок о бок
function buildSubmenuItems() {
  const items = [{ id: 'receipt', label: 'Чеки' }]
  if (isMobile.value) items.push({ id: 'create', label: 'Добавить' })
  return items
}

// Сброс вкладок при уходе со страницы делает router.beforeEach (router/index.js)
const submenuStore = useSubmenuStore()
submenuStore.setItems(buildSubmenuItems())
submenuStore.setActiveTab('receipt')

watch(isMobile, () => {
  submenuStore.setItems(buildSubmenuItems())
  if (!isMobile.value && submenuStore.activeTab === 'create') {
    submenuStore.setActiveTab('receipt')
  }
})

const receiptStore = useReceiptStore()

onMounted(async () => {
  await receiptStore.fetchReceipts()
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
  .container-row {
    flex-wrap: wrap;
  }
}
</style>
