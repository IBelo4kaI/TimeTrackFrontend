<template>
  <div class="container">
    <SickLeaveStats v-if="store.target !== 'all'" />

    <div class="container-row">
      <div class="list-wrapper">
        <SickLeaveList
          :items="store.filteredSickLeaves"
          :is-admin="store.target === 'all'"
          :is-loading="store.isLoading"
        />
      </div>
      <SickLeaveCreate :is-admin="store.target === 'all'" />
    </div>
  </div>
</template>

<script setup>
import SickLeaveCreate from '@/components/SickLeave/SickLeaveCreate.vue'
import SickLeaveList from '@/components/SickLeave/SickLeaveList.vue'
import SickLeaveStats from '@/components/SickLeave/SickLeaveStats.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSickLeaveStore } from '@/stores/sick_leave'
import { onMounted } from 'vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Больничные', 'Управление больничными листами')

const store = useSickLeaveStore()

onMounted(async () => {
  await store.fetchSickLeaves()
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

.list-wrapper {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .container-row {
    flex-wrap: wrap;
  }
}
</style>
