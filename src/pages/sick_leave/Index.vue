<template>
  <div class="container">
    <div class="header-bar">
      <div class="page-title">Больничные листы</div>
      <div class="filters">
        <template v-if="userStore.hasPermission('sick_leaves.all', 'read')">
          <Tabs :tabs="targets" v-model="store.target" type="accent" />
        </template>
        <Tabs :tabs="filterTabs" v-model="store.filter" type="accent" />
      </div>
      <SelectUI :options="years" v-model="store.selectedYear" />
      <ButtonUI @click="addModal.open(store.target === 'all')">
        Добавить больничный
      </ButtonUI>
    </div>

    <SickLeaveList
      :items="store.filteredSickLeaves"
      :is-admin="store.target === 'all'"
      :is-loading="store.isLoading"
    />
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { useAddSickLeaveModalStore } from '@/stores/addSickLeaveModal'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSickLeaveStore } from '@/stores/sick_leave'
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'
import SickLeaveList from './components/SickLeaveList.vue'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Больничные', 'Управление больничными листами')

const userStore = useUserStore()
const store = useSickLeaveStore()
const addModal = useAddSickLeaveModalStore()

const currentYear = new Date().getFullYear()
const years = [currentYear - 1, currentYear, currentYear + 1]

const targets = [
  { id: 'my', label: 'Мои' },
  { id: 'all', label: 'Все' },
]

const filterTabs = [
  { id: 'all', label: 'Все' },
  { id: 'official', label: 'Официальные' },
  { id: 'unofficial', label: 'Неофициальные' },
]

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

.header-bar {
  display: flex;
  justify-content: space-between;
  gap: calc(var(--padding-secondary) / 2);
  align-items: center;
  height: 3rem;
}

.page-title {
  display: flex;
  align-items: center;
  height: 3rem;
  padding: 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  white-space: nowrap;
}

.filters {
  flex: 1;
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
}
</style>
