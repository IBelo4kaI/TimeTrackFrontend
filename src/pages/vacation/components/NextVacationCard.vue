<template>
  <div class="stat-card">
    <div class="stat-row">
      <div class="stat-icon primary">
        <i class="fa-regular fa-calendar-check"></i>
      </div>
      <div class="stat-column">
        <div class="stat-label">Следующий отпуск</div>
        <div class="stat-dates" v-if="nextVacation">
          {{ getDateNamed(new Date(nextVacation.startDate)) }}
          —
          {{ getDateNamed(new Date(nextVacation.endDate)) }}
        </div>
        <div class="stat-count" v-if="nextVacation">
          {{ formatStats(nextVacation.totalDays) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useVacationStore } from '@/stores/vacation'
import { getDateNamed } from '@/utils/calendar.utils'
import { formatStats } from '@/utils/vacation.utils'
import { computed } from 'vue'

const vacationStore = useVacationStore()

const nextVacation = computed(() => {
  return getNextVacation(vacationStore.vacations)
})

function getNextVacation(vacations) {
  const now = new Date()

  return (
    vacations
      .filter((v) => v.status === 'approved' && new Date(v.startDate) >= now)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )[0] ?? null
  )
}
</script>

<style scoped>
.stat-card {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  max-width: 40rem;
  width: 100%;
}

.stat-column {
  display: flex;
  flex-direction: column;
}

.stat-column-gap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-row {
  display: flex;
  gap: 0.75rem;
}

.stat-icon {
  width: 3.14rem;
  height: 3.14rem;
  border-radius: calc(var(--border-radius) * 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.primary {
  background: var(--muted-accent);
  color: var(--accent);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 700;
  flex: 1;
}

.stat-dates {
  font-size: 1.2rem;
  font-weight: 600;
}
.stat-count {
  font-size: 0.9rem;
  color: var(--muted-text);
}
</style>
