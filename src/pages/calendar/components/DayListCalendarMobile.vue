<template>
  <Loader v-if="calendarStore.isLoading" />
  <div v-else-if="!calendarStore.selectedUserId" class="user-no-select">
    Пользователь не выбран
  </div>
  <div
    v-else
    class="calendar"
    :class="{ 'calendar-selecting': selectingStore.isSelecting }"
  >
    <div class="calendar-action-selected">
      <ButtonUI type="muted" @click="changeModeSelecting">
        {{ selectingStore.isSelecting ? 'Отменить' : 'Выбрать' }}
      </ButtonUI>
      <template v-if="selectingStore.isSelecting">
        <span class="calendar-action-item">
          <i class="fa-regular fa-trash"></i>
        </span>
      </template>
    </div>

    <div class="calendar-grid">
      <HeaderCalendar :mini="true" />
      <DayCalendarIsntCurrentMonth v-for="_ in prevMonthDays" />
      <DayCalendarMobile
        v-for="day in calendarDays"
        :day="day"
        :is-selected="selectingStore.isItemSelected(day)"
      />
      <DayCalendarIsntCurrentMonth v-for="_ in nextMonthDays" />
    </div>
  </div>
</template>

<script setup>
import Loader from '@/components/Loader.vue'
import { SelectingHelper } from '@/helpers/selecting.helpers'
import { useCalendarStore } from '@/stores/calendar'
import { useSelectingStore } from '@/stores/selecting'
import { parseDate } from '@/utils/date.utils'
import { storeToRefs } from 'pinia'
import { onUnmounted } from 'vue'
import DayCalendarIsntCurrentMonth from './DayCalendarIsntCurrentMonth.vue'
import DayCalendarMobile from './DayCalendarMobile.vue'
import HeaderCalendar from '@/components/Calendar/HeaderCalendar.vue'
import ButtonUI from '@/components/ButtonUI.vue'

const selectingStore = useSelectingStore()

const calendarStore = useCalendarStore()
const { calendarDays, prevMonthDays, nextMonthDays } =
  storeToRefs(calendarStore)

const selectingHelper = new SelectingHelper(selectingStore)

// Настраиваем store для работы с днями календаря
selectingStore.configure({
  // Функция для получения всех доступных дней
  itemsGetter: () => calendarDays.value,

  // Проверка, можно ли выбрать день (только дни текущего месяца)
  itemValidator: (day) => day,

  // Сравнение дней по дате
  itemComparator: (day1, day2) => {
    if (!day1?.date || !day2?.date) return false
    return parseDate(day1.date).getTime() === parseDate(day2.date).getTime()
  },

  // Выбор диапазона дней
  rangeSelector: (startDay, endDay) => {
    if (!startDay?.date || !endDay?.date) return []

    const startDate = parseDate(startDay.date)
    const endDate = parseDate(endDay.date)

    const start = new Date(Math.min(startDate.getTime(), endDate.getTime()))
    const end = new Date(Math.max(startDate.getTime(), endDate.getTime()))

    const selectedDays = []
    for (let i = start.getDate(); i <= end.getDate(); i++) {
      const day = calendarDays.value.find((d) => {
        return parseDate(d.date).getDate() === i
        // else return false;
      })
      if (day) {
        selectedDays.push(day)
      }
    }

    return selectedDays
  },
})

const changeModeSelecting = () => {
  if (selectingStore.isSelecting) {
    selectingStore.clearSelection()
  }

  selectingStore.isSelecting = !selectingStore.isSelecting
}

onUnmounted(() => {
  selectingStore.clearSelection()
})
</script>

<style scoped>
.calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  border-radius: var(--border-radius);

  transition: all 0.2s ease;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 1fr;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}

.calendar-selecting {
  border: 0.07rem solid var(--accent);
  padding: 0.45rem;
}

.calendar-action-selected {
  grid-column: 1/8;
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  transition: all 0.2s ease;
}

.calendar-action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--foreground);
  padding: 0.41rem 0.71rem;
  height: 3rem;
  max-width: 3rem;
  min-width: 3rem;
}

.user-no-select {
  width: 100%;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
}
</style>
