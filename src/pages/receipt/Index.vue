<template>
  <div class="container">
    <div class="container-row">
      <ReceiptList />
    </div>
  </div>
</template>

<script setup>
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useReceiptStore } from '@/stores/receipt'
import { onMounted } from 'vue'
import ReceiptList from '@/components/Receipt/ReceiptList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Чеки', 'Чеки, чеки, чеки')

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
  height: 100%;
}

@media (max-width: 768px) {
  .container-row {
    flex-wrap: wrap;
  }
}
</style>
