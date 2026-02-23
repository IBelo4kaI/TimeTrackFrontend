<template>
  <div
    ref="dayElement"
    :class="[
      'day',
      { 'day-current-month': day.isCurrentMonth },
      { 'day-selected': isSelected && day.isCurrentMonth },
      {
        'day-weekend':
          (day.isWeekend || !day.isPaidVacation) && day.isCurrentMonth,
      },
      typeDay,
    ]"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
  >
    <div class="day-header">
      <span class="day-number">
        {{ day.isCurrentMonth ? day.date.getDate() : "" }}
      </span>
    </div>
    <div class="day-description" v-if="day.description != ''">
      <i class="fa-solid fa-circle"></i>
      {{ day.description }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const { day, isSelected } = defineProps({
  day: Object,
  isSelected: Boolean,
});

const typeDay = computed(() => `day-${day.type}`);

const emit = defineEmits(["day-mouse-down", "day-mouse-enter", "day-click"]);

const handleMouseDown = (event) => {
  if (!day.isCurrentMonth) return;
  emit("day-mouse-down", day, event);
};

const handleMouseEnter = (event) => {
  if (!day.isCurrentMonth) return;
  emit("day-mouse-enter", day, event);
};
</script>

<style scoped>
.day {
  display: flex;
  flex-direction: column;
  border-top: 0.07rem solid var(--border-color);
  border-right: 0.07rem solid var(--border-color);
  background: var(--foreground);
  min-height: 7rem;
  min-width: 7rem;
  user-select: none;
}
.day:nth-child(7n) {
  border-right: none;
}
.day-current-month {
  cursor: pointer;
  transition: background 0.3s ease;
}
.day-current-month:hover {
  background: var(--muted-accent);
}
.day-header {
  padding: 0.5rem 0.5rem 0 0.5rem;
}
.day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 50%;
  width: 2.14rem;
  height: 100%;
  aspect-ratio: 1/1;
}
.day-number-today {
  background: var(--accent);
  color: var(--on-accent);
}
.day-holiday .day-number {
  background: var(--calendar-holiday);
  color: var(--on-accent);
}
.day-preholiday .day-number {
  background: var(--calendar-muted-preholiday);
  color: var(--text);
}
.day-weekend {
  background: var(--calendar-weekend);
}
.day-description {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--calendar-holiday);
  padding: 0.5rem 0.5rem 0 0.5rem;
  font-size: 0.8rem;
  line-height: 0.8rem;
}
.day-description .fa-circle {
  font-size: 0.5rem;
}
.day-selected {
  background: var(--muted-accent);
  /* color: var(--on-accent); */
}
.day-selected .day-number {
  background: var(--accent);
  color: var(--on-accent);
}
</style>
