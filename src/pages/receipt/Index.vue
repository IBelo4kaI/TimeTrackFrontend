<template>
  <div class="container">
    <div class="container-row">
      <BusinessCards v-if="submenuStore.activeTab === 'cards'" />
      <ReceiptList v-else />
    </div>
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useBusinessCardStore } from '@/stores/businessCard'
import { useReceiptStore } from '@/stores/receipt'
import { useSubmenuStore } from '@/stores/submenu'
import { useUserStore } from '@/stores/user'
import { onMounted, onUnmounted } from 'vue'
import BusinessCards from '@/components/Receipt/BusinessCards.vue'
import ReceiptList from '@/components/Receipt/ReceiptList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Чеки', 'Чеки, чеки, чеки')

const receiptStore = useReceiptStore()
const userStore = useUserStore()

const submenuStore = useSubmenuStore()
const businessCardStore = useBusinessCardStore()
const canReadCards = userStore.hasPermission('business_cards', 'read')
const isCardsAdmin = userStore.hasPermission('business_cards.all', 'read')

// После await страница уже могла смениться — вкладки тогда не трогаем
let isActive = true
onUnmounted(() => (isActive = false))

// Вкладка "Карты": админам всегда, остальным — только если им выдана карта
async function setupSubmenu() {
  if (!canReadCards) return
  const wantCards = businessCardStore.returnToCards
  businessCardStore.returnToCards = false

  if (wantCards) submenuStore.setActiveTab('cards')

  if (!isCardsAdmin) {
    try {
      await businessCardStore.fetchMyCards()
    } catch {
      /* без карт вкладка просто не показывается */
    }
  }

  if (!isActive) return

  if (isCardsAdmin || businessCardStore.myCards.length) {
    submenuStore.setItems([
      { id: 'receipts', label: 'Чеки' },
      { id: 'cards', label: 'Карты' },
    ])
    if (!wantCards) submenuStore.setActiveTab('receipts')
  } else {
    submenuStore.setActiveTab(null)
  }
}

setupSubmenu()

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
  height: 100%;
}

@media (max-width: 768px) {
  .container-row {
    flex-wrap: wrap;
  }
}
</style>
