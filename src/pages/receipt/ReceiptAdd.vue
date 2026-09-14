<template>
  <div class="container">
    <div class="back-row">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>
    </div>

    <ReceiptScan />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import ReceiptScan from '@/components/Receipt/ReceiptScan.vue'

const router = useRouter()

// «Назад» — туда, откуда реально пришли (список чеков), а не всегда на
// /receipts напрямую, как в pages/receipt/Receipt.vue.
function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'receipts' })
  }
}

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Добавить чек', 'Сканирование и ручной ввод')
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
