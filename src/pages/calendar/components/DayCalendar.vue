<template>
  <div
    ref="dayElement"
    :class="[
      'day',
      { 'day-selected': isSelected },
      { 'day-weekend': day.isWeekend },
    ]"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @dblclick="open(day)"
    :title="dayTypesStore.getTypeNameById(day.calendarEventTypeId)"
  >
    <div class="day-header">
      <span class="day-number">
        {{ dayDate.getDate() }}
      </span>
      <template v-if="day.holidays.length > 0">
        <div
          class="day-description"
          :title="day.holidays.length > 0 ? day.holidays.join('\n') : null"
        >
          {{ day.holidays[0] }}
        </div>
      </template>
      <template v-if="birthday.length > 0">
        <span
          class="day-number day-birthday"
          :title="birthday.map((b) => 'День рождения ' + b.fullName + '\n')"
        >
          {{ birthday[0].initials }}
        </span>
      </template>
    </div>
    <div class="day-main">
      <div class="day-hours" v-if="day.hours > 0">
        {{ day.hours }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAddReportModalStore } from '@/stores/addReportModal'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useUserStore } from '@/stores/user'
import { getContrastColor } from '@/utils/color.utils'
import { parseDate } from '@/utils/date.utils'
import { computed, onMounted, useTemplateRef } from 'vue'

const { day, isSelected } = defineProps({
  day: Object,
  isSelected: Boolean,
})
const dayElement = useTemplateRef('dayElement')
const emit = defineEmits(['day-mouse-down', 'day-mouse-enter', 'day-click'])

const userStore = useUserStore()

const addReportStore = useAddReportModalStore()
const { open } = addReportStore

const dayTypesStore = useDayTypesStore()

const dayDate = computed(() => parseDate(day.date))

const birthday = computed(() => {
  return userStore.birthdaysByMonthAndDate(
    dayDate.value.getMonth(),
    dayDate.value.getDate()
  )
})

const handleMouseDown = (event) => {
  // if (!day.isCurrentMonth) return;
  emit('day-mouse-down', day, event)
}

const handleMouseEnter = (event) => {
  // if (!day.isCurrentMonth) return;
  emit('day-mouse-enter', day, event)
}

onMounted(() => {
  if (day.userTimeTypeId) {
    const color = dayTypesStore.getColorById(day.userTimeTypeId)
    dayElement.value.style.setProperty('--background-number', color)
    dayElement.value.style.setProperty('--text-number', getContrastColor(color))
  }
  if (day.calendarEventTypeId) {
    const color = dayTypesStore.getColorById(day.calendarEventTypeId)
    dayElement.value.style.setProperty('--background-number', color)
    dayElement.value.style.setProperty('--text-number', getContrastColor(color))
  }
})
</script>

<style scoped>
.day {
  display: flex;
  flex-direction: column;
  background: var(--foreground);
  color: var(--text);
  border: 0.07rem solid var(--border-color);
  min-height: 8rem;
  min-width: 8rem;
  user-select: none;
  transition: all 0.3s ease;
  border-radius: var(--border-radius);
}
.day:hover {
  --border-color: var(--accent);
  transform: translateY(-0.3rem);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem 0 0.5rem;
}

.day-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  overflow: hidden;
}

.day-hours {
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem;
  border-radius: 50%;
  min-width: 4rem;
  min-height: 4rem;
  max-width: 4rem;
  max-height: 4rem;
  /*height: 100%;*/
  font-size: 1.5rem;
  aspect-ratio: 1/1;
  /*background: var(--background-day, var(--foreground));*/
}

.day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 50%;
  min-width: 2.4rem;
  min-height: 2.4rem;
  max-width: 2.4rem;
  max-height: 2.4rem;
  font-size: 1rem;
  background: var(--background-number, inherit);
  color: var(--text-number, var(--text));
}

.day-birthday {
  background: var(--accent);
  color: var(--on-accent);
  cursor: help;
}

.day-weekend {
  background: var(--calendar-weekend);
}

.day-description {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  line-height: 0.8rem;
}

.day-description .fa-circle {
  font-size: 0.5rem;
}

.day-selected {
  /* background: var(--muted-accent); */
  --border-color: var(--accent);
}

.day-selected .day-number {
  /* background: var(--accent);
  color: var(--on-accent); */
}

.day-selected .day-hours {
  /*color: var(--accent);*/
}
</style>
