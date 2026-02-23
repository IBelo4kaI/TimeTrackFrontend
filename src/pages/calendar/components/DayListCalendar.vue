<template>
  <Loader v-if="calendarStore.isLoading" />
  <div
    v-else
    class="calendar"
    @mousedown="selectingHelper.onMouseDown"
    @mouseup="selectingHelper.onMouseUp"
    @mouseleave="selectingHelper.onMouseLeave"
  >
    <HeaderCalendar />
    <DayCalendarIsntCurrentMonth
      v-for="_ in prevMonthDays"
      @click="selectingStore.clearSelection"
    />
    <DayCalendar
      v-for="day in calendarDays"
      :day="day"
      :is-selected="selectingStore.isItemSelected(day)"
      @mousedown="selectingHelper.onDayMouseDown(day, $event)"
      @mouseenter="selectingHelper.onDayMouseEnter(day)"
      @contextmenu.prevent="(e) => openCalendarMenu(e, day)"
    />
    <DayCalendarIsntCurrentMonth
      v-for="_ in nextMonthDays"
      @click="selectingStore.clearSelection"
    />
    <ContextMenu />
  </div>
</template>

<script setup>
import HeaderCalendar from '@/components/Calendar/HeaderCalendar.vue'
import ContextMenu from '@/components/ContextMenu/ContextMenu.vue'
import Loader from '@/components/Loader.vue'
import { SelectingHelper } from '@/helpers/selecting.helpers'
import { createUpdatesObjects } from '@/helpers/usertimeentry.helpers'
import { useCalendarStore } from '@/stores/calendar'
import { useContextMenuStore } from '@/stores/contexMenu'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useSelectingStore } from '@/stores/selecting'
import { parseDate, parseDateStartDay } from '@/utils/date.utils'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, watch } from 'vue'
import DayCalendar from './DayCalendar.vue'
import DayCalendarIsntCurrentMonth from './DayCalendarIsntCurrentMonth.vue'
import { useUserStore } from '@/stores/user'

const contextMenuStore = useContextMenuStore()
const selectingStore = useSelectingStore()
const { selectedItems } = storeToRefs(selectingStore)

const calendarStore = useCalendarStore()
const { calendarDays, prevMonthDays, nextMonthDays } =
  storeToRefs(calendarStore)

const dayTypesStore = useDayTypesStore()

const selectingHelper = new SelectingHelper(selectingStore)

// Определяем пункты меню
const menuItems = [
  { action: 'medical', label: 'Больничный', icon: 'medical' },
  { action: 'decree', label: 'Декрет', icon: 'decree' },
  { action: 'time-off', label: 'Отгул', icon: 'time-off' },
  { action: 'standardWork', label: 'Рабочий день (8ч)', icon: 'work' },
  { action: 'separator2', type: 'separator' },
  { action: 'clear', label: 'Очистить', icon: 'delete', danger: true },
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
        .map((day) => parseDateStartDay(day.date))

      if (userTimeIds.length > 0) {
        await calendarStore.deleteDay({
          userId: calendarStore.selectedUserId,
          entryDate: userTimeIds,
        })
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

// Функция открытия меню
const openCalendarMenu = (event, day) => {
  // Проверка перед открытием
  const beforeOpen = (data) => {
    if (!selectedItems.value.has(data.day)) {
      selectingStore.clearSelection()
      selectingStore.startSelection(data.day)
      selectingStore.endSelection()
    }

    return true
  }

  contextMenuStore.openMenu(event, {
    items: menuItems,
    data: { day },
    onAction: handleContextAction,
    beforeOpen,
  })
}

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

const clearKeyboard = (e) => {
  if (e.key == 'Escape') {
    selectingStore.clearSelection()
    contextMenuStore.contextClose()
  }
}

document.addEventListener('keydown', clearKeyboard)

onUnmounted(() => {
  selectingStore.clearSelection()
  document.removeEventListener('keydown', clearKeyboard)
})

onMounted(async () => {
  await calendarStore.init()
})
</script>

<style scoped>
.calendar {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: 3rem;
  grid-auto-rows: 1fr;
  /*border: 0.07rem solid var(--border-color);*/
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
  overflow: auto;
  border-radius: var(--border-radius);
}
</style>
