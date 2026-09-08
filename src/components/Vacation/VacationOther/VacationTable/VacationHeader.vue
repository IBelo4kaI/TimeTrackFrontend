<template>
  <div class="vacation-table__header">
    <div class="vacation-table__header-title" ref="titleEl">Сотрудник</div>

    <!-- Count vacation column (both views) -->
    <div class="vacation-table__header-count-vacation">Исп. / Утв. (д)</div>

    <!-- Dates column (both views) -->
    <div class="vacation-table__header-dates">Даты</div>

    <!-- Year view header -->
    <div v-if="isYearView" class="vacation-table__header-months" ref="gridEl">
      <div
        class="vacation-table__header-month"
        v-for="(month, i) in months"
        :key="i"
        :style="{ width: monthWidthPercent(month) + '%' }"
      >
        {{ formatMonth(month) }}
      </div>
    </div>

    <!-- Month view header -->
    <div v-else class="vacation-table__header-days" ref="gridEl">
      <div
        class="vacation-table__header-day"
        :class="{
          'vacation-table__header-day--weekend': isWeekend(day.date),
        }"
        v-for="day in days"
        :key="day.dateStr"
      >
        <span class="header-day__label">{{ day.label }}</span>
        <span class="header-day__num">{{ day.num }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  formatMonth,
  isWeekend,
  daysInMonth,
  diffDays,
} from './vacationUtils.js'

// Границы для VacationTable.vue: по ним считаем, докрутили ли до конца
// колонки "Даты" (см. .vacation-table__header-title/.vacation-table__header-days
// ниже и updateCompact() в VacationTable.vue).
const titleEl = ref(null)
const gridEl = ref(null)
defineExpose({ titleEl, gridEl })

const props = defineProps({
  isYearView: {
    type: Boolean,
    required: true,
  },
  months: {
    type: Array,
    default: () => [],
  },
  days: {
    type: Array,
    default: () => [],
  },
  rangeStart: {
    type: Date,
    required: true,
  },
  rangeEnd: {
    type: Date,
    required: true,
  },
})

const totalDays = computed(() => diffDays(props.rangeStart, props.rangeEnd) + 1)

function monthWidthPercent(monthDate) {
  return (daysInMonth(monthDate) / totalDays.value) * 100
}
</script>

<style scoped>
.vacation-table__header {
  display: flex;
  background: var(--foreground);
  border-bottom: 0.07rem solid var(--border-color);
  position: sticky;
  top: 0;
}

.vacation-table__header-title {
  width: 15rem;
  min-width: 15rem;
  display: flex;
  align-items: center;
  padding: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-right: 0.07rem solid var(--border-color);
}

@media (max-width: 768px) {
  .vacation-table__header-title {
    position: sticky;
    left: 0;
    z-index: 3;
    background: var(--foreground);
    /* Safari иначе не перерисовывает фон закреплённого элемента при скролле
       (мерцает/пропадает) — форсируем отдельный composite-слой. */
    transform: translateZ(0);
    will-change: transform;
  }

  /* Текстовые даты дублируют то, что и так видно по цветным полосам в
     гриде — на мобилке убираем, чтобы меньше скроллить по горизонтали. */
  .vacation-table__header-dates {
    display: none;
  }
}

/* Year view header */
.vacation-table__header-months {
  flex: 1;
  display: flex;
}

.vacation-table__header-month {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted-text);
  border-right: 0.07rem solid var(--border-color);
}
.vacation-table__header-month:last-child {
  border-right: none;
}

.vacation-table__header-count-vacation {
  width: 7rem;
  min-width: 7rem;
  display: flex;
  align-items: center;
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-right: 0.07rem solid var(--border-color);
}

.vacation-table__header-dates {
  width: 8rem;
  min-width: 8rem;
  display: flex;
  align-items: center;
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-right: 0.07rem solid var(--border-color);
}

/* Month view header */
.vacation-table__header-days {
  flex: 1;
  display: flex;
}

.vacation-table__header-day {
  flex: 1;
  min-width: 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.25rem;
  font-size: 0.7rem;
  border-right: 0.07rem solid var(--border-color);
}
.vacation-table__header-day:last-child {
  border-right: none;
}
.vacation-table__header-day--weekend {
  background: var(--calendar-weekend, rgba(0, 0, 0, 0.04));
  color: var(--muted-text);
}

.header-day__label {
  font-weight: 500;
  color: var(--muted-text);
}
.header-day__num {
  font-weight: 700;
}
</style>
