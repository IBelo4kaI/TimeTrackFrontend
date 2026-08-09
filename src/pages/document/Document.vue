<template>
  <div class="container"><VacationList /></div>
</template>
<script setup>
import VacationList from '@/components/Document/VacationList.vue'
</script>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
</style>
