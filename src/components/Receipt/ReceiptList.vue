<template>
  <div class="receipt-list">
    <div class="receipt-list__controls">
      <template v-if="isAdmin">
        <Tabs
          :tabs="targets"
          v-model="receiptStore.target"
          type="line"
          class="target-tabs"
        />
      </template>

      <template v-if="!isMobile">
        <SelectUI
          variant="line"
          align="center"
          :options="years"
          v-model="receiptStore.selectedYear"
        />
      </template>

      <button
        v-else
        type="button"
        class="filter-trigger"
        @click="filtersOpen = true"
        aria-label="Фильтры"
      >
        <i class="fa-regular fa-filter"></i>
      </button>

      <div class="receipt-list__total" v-if="!isMobile">
        Итого:
        <b>{{ formatMoney(receiptStore.totalSum) }}</b>
      </div>
    </div>

    <MobileFilterDrawer v-model="filtersOpen">
      <SelectUI
        label="Год"
        full-width
        :options="years"
        v-model="receiptStore.selectedYear"
      />
    </MobileFilterDrawer>

    <table class="receipt-list__items">
      <tbody>
        <template
          v-if="
            !receiptStore.isLoading && receiptStore.filterReceipts.length > 0
          "
          v-for="item in receiptStore.filterReceipts"
          :key="item.id"
        >
          <ReceiptItem :item="item" :is-admin="receiptStore.target == 'all'" />
        </template>
        <template v-else-if="!receiptStore.isLoading">
          <tr>
            <td class="receipt-item__empty">
              <span>Чеки не найдены</span>
            </td>
          </tr>
        </template>
        <template v-else>
          <tr>
            <td class="receipt-item__empty">
              <LoaderTitle />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import MobileFilterDrawer from '@/components/MobileFilterDrawer.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { useReceiptStore } from '@/stores/receipt'
import { useThemeStore } from '@/stores/themes.js'
import { useUserStore } from '@/stores/user.js'
import { formatMoney } from '@/utils/receipt.utils'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import ReceiptItem from './ReceiptItem.vue'

const receiptStore = useReceiptStore()
const userStore = useUserStore()
const { isMobile } = storeToRefs(useThemeStore())

const filtersOpen = ref(false)

// как у vacation.all:read (см. комментарий в VacationList.vue) — вкладка
// "Все чеки" для бухгалтерии/руководителей
const isAdmin = computed(() => userStore.hasPermission('receipts.all', 'read'))

const targets = [
  { id: 'my', label: 'Мои чеки' },
  { id: 'all', label: 'Все чеки' },
]

const years = [
  receiptStore.selectedYear - 1,
  receiptStore.selectedYear,
  receiptStore.selectedYear + 1,
]
</script>

<style scoped>
.receipt-list {
  flex: 1;

  display: flex;
  flex-direction: column;

  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);

  padding: var(--padding-secondary);

  height: 100%;
}

.receipt-list__controls {
  display: flex;
  align-items: flex-end;
  gap: 2rem;
  border-bottom: 0.07rem solid var(--border-color);
  padding-bottom: var(--padding-secondary);
}

.receipt-list__total {
  margin-left: auto;
  color: var(--muted-text);
}

.receipt-list__items {
  border-collapse: collapse;
}

.receipt-item__empty {
  padding: var(--padding-secondary);
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
  color: var(--muted-text);
}

.filter-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--background);
  color: var(--text);
  font-size: 1.14rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .receipt-list__controls {
    align-items: center;
    padding-bottom: var(--gap-primary);
    gap: var(--gap-primary);
    border-bottom: none;
  }

  .target-tabs {
    flex: 1;
    min-width: 0;
  }

  .target-tabs :deep(.tabs-item) {
    flex: 1;
    justify-content: center;
  }
}
</style>
