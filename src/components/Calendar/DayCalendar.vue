<template>
  <div
    :class="[
      'day',
      { 'day-selected': isSelected },
      { 'day-weekend': day.isWeekend },
      { 'day-birthday-hovered': isBirthdayHovered },
    ]"
    :style="dayStyle"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dblclick="open(day)"
  >
    <div class="day-header">
      <span class="day-number">
        {{ dayDate.getDate() }}
      </span>
      <template v-if="birthday.length > 0">
        <span class="day-number day-birthday">
          <svg class="day-dot" viewBox="0 0 8 8" aria-hidden="true">
            <circle cx="4" cy="4" r="4" />
          </svg>
        </span>
      </template>
    </div>
    <div class="day-main">
      <div class="day-hours" v-if="day.hours > 0">
        {{ day.hours }}
      </div>
    </div>
    <div class="day-footer">
      <div
        class="day-usertype day-flex-row"
        :class="{ 'day-dot-only': day.calendarEventTypeId }"
        v-if="day.userTimeTypeId"
      >
        <span class="day-circle">
          <svg class="day-dot" viewBox="0 0 8 8" aria-hidden="true">
            <circle cx="4" cy="4" r="4" />
          </svg>
        </span>
        <span v-if="!day.calendarEventTypeId" class="day-label">
          {{ dayTypesStore.getTypeNameById(day.userTimeTypeId) }}
        </span>
      </div>
      <div class="day-holiday day-flex-row" v-if="day.calendarEventTypeId">
        <span class="day-circle">
          <svg class="day-dot" viewBox="0 0 8 8" aria-hidden="true">
            <circle cx="4" cy="4" r="4" />
          </svg>
        </span>
        <span v-if="day.holidays.length == 0" class="day-label">
          {{ dayTypesStore.getTypeNameById(day.calendarEventTypeId) }}
        </span>
        <span v-else class="day-label">
          {{ day.holidays[0] }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAddReportModalStore } from '@/stores/addReportModal'
import { useCalendarStore } from '@/stores/calendar'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useThemeStore } from '@/stores/themes'
import { useUserStore } from '@/stores/user'
import { themedBackground } from '@/utils/color.utils'
import { parseDate } from '@/utils/date.utils'
import { computed } from 'vue'

const { day, isSelected } = defineProps({
  day: Object,
  isSelected: Boolean,
})
const emit = defineEmits(['day-mouse-down', 'day-mouse-enter', 'day-click'])

const userStore = useUserStore()

const addReportStore = useAddReportModalStore()
const { open } = addReportStore

const dayTypesStore = useDayTypesStore()
const calendarStore = useCalendarStore()
const themeStore = useThemeStore()

const dayDate = computed(() => parseDate(day.date))

const birthday = computed(() => {
  return userStore.birthdaysByMonthAndDate(
    dayDate.value.getMonth(),
    dayDate.value.getDate()
  )
})

const isBirthdayHovered = computed(
  () => dayDate.value.getDate() == calendarStore.hoveredBirthday
)

const handleMouseDown = (event) => {
  // if (!day.isCurrentMonth) return;
  emit('day-mouse-down', day, event)
}

const handleMouseEnter = (event) => {
  // if (!day.isCurrentMonth) return;
  emit('day-mouse-enter', day, event)
  if (birthday.value.length > 0) {
    calendarStore.hoverBirthday(birthday.value[0].birthday)
  }
}

const handleMouseLeave = (event) => {
  if (birthday.value.length > 0) {
    calendarStore.resetHoveredBirthday()
  }
}

// Цвета зависят от темы, поэтому считаем реактивно, а не один раз при монтировании
const dayStyle = computed(() => {
  const dark = themeStore.isDarkApplied
  const style = {}
  if (day.userTimeTypeId) {
    const color = dayTypesStore.getColorById(day.userTimeTypeId)
    style['--usertype'] = color
    style['--usertype-back'] = themedBackground(color, dark)
    style['--day-back'] = themedBackground(color, dark)
  }
  if (day.calendarEventTypeId) {
    const color = dayTypesStore.getColorById(day.calendarEventTypeId)
    style['--calendartype'] = color
    style['--calendartype-back'] = themedBackground(color, dark)
    style['--day-back'] = themedBackground(color, dark)
  }
  return style
})
</script>

<style scoped>
.day {
  display: flex;
  flex-direction: column;
  min-width: 8rem;
  min-height: 8rem;
  background: var(--day-back, var(--foreground));
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text);
  user-select: none;
  transition: all 0.3s ease;
}

.day:hover {
  --border-color: var(--accent);
}

.day-weekend {
  background: var(--calendar-weekend);
}

.day-selected {
  --border-color: var(--accent);
}

.day-birthday-hovered {
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

.day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border-radius: var(--border-radius);
  background: var(--background);
  font-size: 1rem;
  font-weight: 500;
}

.day-dot {
  width: 0.77rem;
  height: 0.77rem;
  overflow: visible;
  fill: currentColor;
}

.day-birthday {
  color: var(--accent);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1/1;
  padding: 0.3rem;
  border-radius: 50%;
  font-size: 1.2rem;
  text-align: center;
}

.day-footer {
  display: flex;
  gap: 0.25rem;
  padding: 0 0.5rem 0.5rem 0.5rem;
  overflow: hidden;
}

.day-flex-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.33rem;
  border-radius: 2rem;
}

/* Флекс-элементы по умолчанию min-width: auto — не сжимаются и толкают
   .day-footer за границы .day. min-width: 0 разрешает сжатие, а обрезаем
   многоточием именно текст (.day-label), а не всю строку с иконкой. */
.day-usertype,
.day-holiday {
  max-width: 100%;
  font-size: 0.77rem;
}

.day-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.day-circle {
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-dot-only {
  aspect-ratio: 1/1;
  justify-content: center;
  border-radius: 50%;
}

.day-usertype {
  background: var(--usertype-back, var(--foreground));
}

.day-holiday {
  background: var(--calendartype-back, var(--foreground));
  min-width: 0;
}

.day-usertype {
  color: var(--usertype, #343434);
}

.day-holiday {
  color: var(--calendartype, #343434);
}
</style>
