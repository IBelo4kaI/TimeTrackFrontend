<template>
  <div class="vacation-list">
    <VacationItem
      v-if="items.length > 0"
      v-for="item in items"
      :item="item"
      :is-admin="isAdmin"
    />
    <div class="empty" v-else>Заявки не найдены</div>
  </div>
</template>

<script setup>
import VacationItem from './VacationItem.vue'

const props = defineProps({
  items: { type: Array },
  isAdmin: { type: Boolean, default: false },
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
