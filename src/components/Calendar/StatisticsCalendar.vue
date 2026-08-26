<template>
  <div class="statistics">
    <div class="statistics__row">
      <div class="statistics__title">Норма часов</div>
      <div class="statistics__value">
        {{ calendarStore.workingHours.standardHours }} ч
      </div>
    </div>
    <div class="statistics__row">
      <div class="statistics__title">Отработано часов</div>
      <div class="statistics__value">
        {{ calendarStore.workingHours.totalHours }} ч
      </div>
    </div>
    <div class="statistics__row" v-if="calendarStore.plannedHours !== null">
      <div class="statistics__title" v-tooltip="'Отработано + плановая отработка по оставшимся дням'">
        Плановое кол-во часов
      </div>
      <div class="statistics__value">{{ calendarStore.plannedHours }} ч</div>
    </div>
    <div class="statistics__row" v-if="overtimeHours !== 0">
      <div class="statistics__title">
        {{ overtimeHours > 0 ? 'Переработка' : 'Недоработка' }}
      </div>
      <div
        class="statistics__value"
        :class="
          overtimeHours > 0
            ? 'statistics__value--positive'
            : 'statistics__value--negative'
        "
      >
        {{ overtimeHours > 0 ? '+' : '' }}{{ overtimeHours }} ч
      </div>
    </div>
    <div class="statistics__row">
      <div class="statistics__title">Норма дней</div>
      <div class="statistics__value">
        {{ calendarStore.workingDays.standardWorkDays }}
      </div>
    </div>
    <div class="statistics__row">
      <div class="statistics__title">Отработано дней</div>
      <div class="statistics__value">
        {{ calendarStore.workingDays.totalWorkDays }}
      </div>
    </div>
    <div
      class="statistics__row"
      v-if="calendarStore.otherDays.vacationDays.count"
    >
      <div class="statistics__title">Отпуск</div>
      <div class="statistics__value">
        {{ calendarStore.otherDays.vacationDays.count }} д
      </div>
    </div>
    <div
      class="statistics__row"
      v-if="calendarStore.otherDays.medicalDays.count"
    >
      <div class="statistics__title">Больничный</div>
      <div class="statistics__value">
        {{ calendarStore.otherDays.medicalDays.count }} д
      </div>
    </div>
    <div
      class="statistics__row"
      v-if="calendarStore.otherDays.timeoffDays.count"
    >
      <div class="statistics__title">Отгул</div>
      <div class="statistics__value">
        {{ calendarStore.otherDays.timeoffDays.count }} д
      </div>
    </div>
    <div
      class="statistics__row"
      v-if="calendarStore.otherDays.decreeDays.count"
    >
      <div class="statistics__title">Декрет</div>
      <div class="statistics__value">
        {{ calendarStore.otherDays.decreeDays.count }} д
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCalendarStore } from '@/stores/calendar'
import { computed } from 'vue'

const calendarStore = useCalendarStore()

// effectiveStandardHours — норма месяца за вычетом нормы дней отпуска (см.
// calendarStore), чтобы отпуск не считался недоработкой, если остальные
// дни отработаны как надо.
const overtimeHours = computed(() => {
  const total = calendarStore.workingHours.totalHours
  const standard = calendarStore.effectiveStandardHours
  return total - standard
})
</script>

<style scoped>
.statistics {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}
.statistics__row {
  display: flex;
  justify-content: space-between;
  gap: 0.71rem;
  background: var(--foreground);
  padding: 0.71rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
.statistics__title {
  font-weight: 500;
}
.statistics__value {
  font-weight: 700;
}
.statistics__value--positive {
  color: var(--color-success, #22c55e);
}
.statistics__value--negative {
  color: var(--color-danger, #ef4444);
}

@media (max-width: 768px) {
  .statistics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }

  .statistics__row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .statistics__title {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--text-secondary, #888);
  }

  .statistics__value {
    font-size: 1.1rem;
  }
}
</style>
