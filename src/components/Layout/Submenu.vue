<template>
  <div class="submenu" v-if="store.items.length > 0">
    <Tabs :tabs="store.items" v-model="store.activeTab" type="default" />
  </div>
</template>
<script setup>
import { useSubmenuStore } from '@/stores/submenu'
import Tabs from '../Tabs.vue'

const store = useSubmenuStore()
</script>
<style scoped>
.submenu {
  padding: 0.71rem var(--padding-primary);
  background: var(--foreground);
  border-bottom: 0.07rem solid var(--border-color);
}
</style>
