<template>
  <div class="container">
    <div class="back-row">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>
    </div>

    <div class="form-row">
      <VacationCreate
        ref="formRef"
        :show-open-button="false"
        @range-change="range = $event"
      />
      <VacationRangeCalendar
        :start-date="range.startDate"
        :end-date="range.endDate"
        :user-id="range.userId"
        :days="range.days"
        @select="formRef?.setDates($event)"
      />
    </div>
  </div>
</template>

<script setup>
import VacationCreate from '@/components/Vacation/VacationCreate.vue'
import VacationRangeCalendar from '@/components/Vacation/VacationRangeCalendar.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formRef = ref(null)
const range = ref({ startDate: '', endDate: '', userId: '', days: null })

useHeaderTitleStore().setTitle('Создание отпуска', 'Новая заявка на отпуск')

// «Назад» — туда, откуда пришли, иначе к списку отпусков
function goBack() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'vacation' })
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
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

.form-row {
  display: flex;
  align-items: flex-start;
  gap: calc(var(--padding-secondary) / 2);
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
