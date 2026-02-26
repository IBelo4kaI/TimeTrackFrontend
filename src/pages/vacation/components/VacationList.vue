<template>
  <div class="vacation-list">
    <Loader v-if="isLoading" />
    <template v-else>
      <VacationItem
        v-if="items.length > 0"
        v-for="item in items"
        :item="item"
        :is-admin="isAdmin"
      />
      <div class="empty" v-else>Заявки не найдены</div>
    </template>
  </div>
</template>

<script setup>
import Loader from '@/components/Loader.vue'
import VacationItem from './VacationItem.vue'

const props = defineProps({
  items: { type: Array },
  isAdmin: { type: Boolean, default: false },
  isLoading: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.vacation-list {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}
.empty {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}
</style>
