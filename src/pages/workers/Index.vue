<template>
  <div class="container">
    <div class="workers-actions">
      <div class="actions-search">
        <InputUi
          style="width: 17.86rem"
          id="search"
          placeholder="Поиск сотрудников..."
        />
      </div>
      <div class="action-buttons">
        <ButtonUI icon="fa-light fa-filter" type="muted">Фильтр</ButtonUI>
      </div>
    </div>
    <div class="workers-statistic">
      <CardStatistic title="Всего сотрудников" content="0" />
      <CardStatistic
        title="На работе"
        content="4"
        content-style="statistic-work"
      />
      <CardStatistic
        title="В отпуске"
        content="0"
        content-style="statistic-vacation"
      />
      <CardStatistic
        title="На больничном"
        content="0"
        content-style="statistic-medical"
      />
    </div>
    <div class="workers-list">
      <CardWorker />
      <CardWorker />
      <CardWorker />
      <CardWorker />
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import CardStatistic from '@/components/CardStatistic.vue'
import InputUi from '@/components/InputUi.vue'
import CardWorker from './components/CardWorker.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Сотрудники', 'Список сотрудников')
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: var(--padding-primary);
  height: 100%;
}
.workers-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
}
.action-buttons {
  display: flex;
  gap: 0.71rem;
  justify-content: space-between;
}
.workers-statistic {
  display: flex;
  gap: var(--padding-primary);
  justify-content: space-between;
  flex-wrap: wrap;
}
.workers-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14.29rem, 1fr));
  gap: var(--padding-primary);
}
</style>
