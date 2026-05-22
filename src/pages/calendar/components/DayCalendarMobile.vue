<template>
  <div
    ref="dayElement"
    :class="[
      'day',
      { 'day-selected': isSelected },
      { 'day-weekend': day.isWeekend },
    ]"
    @touchstart="handleMouseDown"
    @touchmove="handleMouseEnter"
    @click="selectingStore.isSelecting ? selectDay(day) : open(day)"
  >
    <span class="day-number">
      {{ dayDate.getDate() }}
    </span>
  </div>
</template>

<script setup>
import { useAddReportModalStore } from '@/stores/addReportModal'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useSelectingStore } from '@/stores/selecting'
import { getContrastColor } from '@/utils/color.utils'
import { parseDate } from '@/utils/date.utils'
import { computed, onMounted, useTemplateRef } from 'vue'

const { day, isSelected } = defineProps({
  day: Object,
  isSelected: Boolean,
})
const dayElement = useTemplateRef('dayElement')
const emit = defineEmits(['day-mouse-down', 'day-mouse-enter', 'day-click'])

const addReportStore = useAddReportModalStore()
const { open } = addReportStore

const dayTypesStore = useDayTypesStore()

const selectingStore = useSelectingStore()

const dayDate = computed(() => parseDate(day.date))
const handleMouseDown = (event) => {
  // if (!day.isCurrentMonth) return;
  console.log('down')

  emit('day-mouse-down', day, event)
}

const handleMouseEnter = (event) => {
  // if (!day.isCurrentMonth) return;
  console.log('enter', day, event)

  emit('day-mouse-enter', day, event)
}

const selectDay = (day) => {
  if (isSelected) {
    selectingStore.removeItem(day)
  } else {
    selectingStore.addItem(day)
  }
}

onMounted(() => {
  if (day.calendarEventTypeId && day.userTimeTypeId) {
    const uColor = dayTypesStore.getColorById(day.userTimeTypeId)
    const cColor = dayTypesStore.getColorById(day.calendarEventTypeId)

    dayElement.value.style.setProperty('--border-color', cColor)
    dayElement.value.style.setProperty('--background-number', uColor)
    dayElement.value.style.setProperty(
      '--text-number',
      getContrastColor(uColor)
    )
  } else if (day.userTimeTypeId) {
    const color = dayTypesStore.getColorById(day.userTimeTypeId)
    dayElement.value.style.setProperty('--background-number', color)
    dayElement.value.style.setProperty('--text-number', getContrastColor(color))
  } else if (day.calendarEventTypeId) {
    const color = dayTypesStore.getColorById(day.calendarEventTypeId)
    dayElement.value.style.setProperty('--background-number', color)
    dayElement.value.style.setProperty('--text-number', getContrastColor(color))
  }
})
</script>

<style scoped>
.day {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  min-width: 2rem;
  padding: 0.5rem;
  user-select: none;
  color: var(--text);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 50%;
  min-width: 2rem;
  min-height: 2rem;
  max-width: 2rem;
  max-height: 2rem;
  font-size: 1rem;
  font-weight: 600;
  background: var(--background-number, inherit);
  color: var(--text-number, var(--text));
}

.day-weekend {
  background: var(--calendar-weekend);
}

.day-selected {
  /* background: var(--muted-accent); */
  --border-color: var(--accent) !important;
}

.day-selected .day-number {
  /* background: var(--accent);
  color: var(--on-accent); */
}
</style>
