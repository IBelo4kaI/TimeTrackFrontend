<template>
  <div
    class="calendar"
    :class="{ 'calendar-selecting': selectingStore.isSelecting }"
  >
    <div class="calendar-action-selected">
      <ButtonUI type="muted" @click="changeModeSelecting">
        {{ selectingStore.isSelecting ? 'Отменить' : 'Выбрать' }}
      </ButtonUI>
      <template v-if="selectingStore.isSelecting">
        <span
          class="calendar-action-item"
          v-for="value in menuItems"
          @click="handleContextAction(value.action)"
        >
          <i :class="value.icon"></i>
        </span>
      </template>
    </div>

    <div class="calendar-grid">
      <HeaderCalendar :mini="true" />

      <DayCalendarIsntCurrentMonth
        v-if="!calendarStore.isLoading"
        v-for="_ in prevMonthDays"
        @click="selectingStore.clearSelection"
      />
      <DayCalendarMobile
        v-if="!calendarStore.isLoading"
        v-for="day in calendarDays"
        :day="day"
        :is-selected="selectingStore.isItemSelected(day)"
      />
      <DayCalendarIsntCurrentMonth
        v-else
        v-for="_ in 35"
        @click="selectingStore.clearSelection"
      />
      <DayCalendarIsntCurrentMonth
        v-if="!calendarStore.isLoading"
        v-for="_ in nextMonthDays"
        @click="selectingStore.clearSelection"
      />
    </div>
  </div>
</template>

<script setup>
import HeaderCalendar from '@/components/Calendar/HeaderCalendar.vue'
import { SelectingHelper } from '@/helpers/selecting.helpers'
import { createUpdatesObjects } from '@/helpers/usertimeentry.helpers'
import { useCalendarStore } from '@/stores/calendar'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useSelectingStore } from '@/stores/selecting'
import { parseDate, parseDateStartDay } from '@/utils/date.utils'
import { storeToRefs } from 'pinia'
import { onUnmounted } from 'vue'
import DayCalendarIsntCurrentMonth from './DayCalendarIsntCurrentMonth.vue'

import ButtonUI from '@/components/ButtonUI.vue'
import DayCalendarMobile from './DayCalendarMobile.vue'

const selectingStore = useSelectingStore()

const calendarStore = useCalendarStore()
const { calendarDays, prevMonthDays, nextMonthDays } =
  storeToRefs(calendarStore)

const dayTypesStore = useDayTypesStore()

// Определяем пункты меню
const menuItems = [
  // { action: 'medical', label: 'Больничный', icon: 'fa-regular fa-house-medical' },
  // { action: 'decree', label: 'Декрет', icon: 'decree' },
  { action: 'time-off', label: 'Отгул', icon: 'fa-regular fa-user-clock' },
  {
    action: 'standardWork',
    label: 'Рабочий день (8ч)',
    icon: 'fa-regular fa-briefcase',
  },
  // { action: 'separator2', type: 'separator' },
  {
    action: 'clear',
    label: 'Очистить',
    icon: 'fa-regular fa-trash',
    danger: true,
  },
]

// Обработчик действий меню
const handleContextAction = async (action) => {
  const selectedItems = selectingStore.selectedItems
  console.log(selectedItems.values)

  try {
    // Определяем дни для обработки
    const daysToProcess = Array.from(selectedItems)

    if (action === 'clear') {
      // Удаление - собираем только существующие userTimeId
      const userTimeIds = daysToProcess
        .filter((day) => day.userTimeId && day.userTimeId !== '')
        .filter(
          (day) =>
            day.userTimeTypeId != dayTypesStore.getDayTypeIdByName('vacation')
        )
        .map((day) => parseDateStartDay(day.date))

      if (userTimeIds.length > 0) {
        await calendarStore.deleteDay({
          userId: calendarStore.selectedUserId,
          entryDate: userTimeIds,
        })
      }
      const vacDays = daysToProcess
        .filter((day) => day.userTimeId && day.userTimeId !== '')
        .filter(
          (day) =>
            day.userTimeTypeId == dayTypesStore.getDayTypeIdByName('vacation')
        )

      if (vacDays.length > 0) {
        const updates = createUpdatesObjects(
          vacDays,
          {
            userTimeTypeId: dayTypesStore.getDayTypeIdByName('vacation'),
            hours: 0,
          },
          calendarStore.selectedUserId
        )

        console.log(updates, vacDays)

        await calendarStore.updateDay(updates.toUpdate, updates.toCreate)
      }
    } else {
      // Обновление - определяем тип дня и часы
      const actionConfig = {
        medical: {
          userTimeTypeId: dayTypesStore.getDayTypeIdByName('medical'),
          hours: null,
        }, // Замени на реальный ID
        decree: {
          userTimeTypeId: dayTypesStore.getDayTypeIdByName('decree'),
          hours: null,
        }, // Замени на реальный ID
        'time-off': {
          userTimeTypeId: dayTypesStore.getDayTypeIdByName('time-off'),
          hours: null,
        }, // Замени на реальный ID
        standardWork: {
          userTimeTypeId: dayTypesStore.getDayTypeIdByName('work'),
          hours: 8,
        }, // Замени на реальный ID
      }

      const config = actionConfig[action]

      if (!config) return

      // Создаем объект для сбора данных
      const updates = createUpdatesObjects(
        daysToProcess,
        config,
        calendarStore.selectedUserId
      )
      console.log(updates, daysToProcess)

      await calendarStore.updateDay(updates.toUpdate, updates.toCreate)
    }

    selectingStore.clearSelection()
  } catch (error) {
    console.error('Ошибка при выполнении действия:', error)
    throw error
  }
}

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
