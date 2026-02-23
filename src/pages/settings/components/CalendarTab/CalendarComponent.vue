<template>
  <div
    class="calendar"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
  >
    <HeaderCalendar />
    <CalendarDay
      v-for="day in calendars"
      :key="day.date ? day.date.getTime() : day.id"
      :day="day"
      :is-selected="selectingStore.isItemSelected(day)"
      @mousedown="onDayMouseDown(day, $event)"
      @mouseenter="onDayMouseEnter(day)"
      @contextmenu.prevent="openCalendarMenu($event, day)"
    />
    <ContextMenu />
  </div>
</template>

<script setup>
import HeaderCalendar from "@/components/Calendar/HeaderCalendar.vue";
import ContextMenu from "@/components/ContextMenu/ContextMenu.vue";
import { useContextMenuStore } from "@/stores/contexMenu";
import { useSelectingStore } from "@/stores/selecting";
import { useSettingCalendarStore } from "@/stores/settingCalendar";
import { storeToRefs } from "pinia";
import { onUnmounted } from "vue";
import CalendarDay from "./CalendarDay.vue";

const contextMenuStore = useContextMenuStore();
const selectingStore = useSelectingStore();
const { selectedItems } = storeToRefs(selectingStore);

const settingStore = useSettingCalendarStore();
const { calendars } = storeToRefs(settingStore);

// Определяем пункты меню
const menuItems = [
  { action: "edit", label: "Редактировать" },
  { action: "separator", type: "separator" },
  { action: "clear", label: "Очистить", danger: true },
];

// Обработчик действий меню
const handleContextAction = (action) => {
  switch (action) {
    case "edit":
      console.log("Не реализовано");
      break;

    case "clear":
      selectedItems.value.forEach((d) => {
        console.log("Не реализовано");
      });
      break;
  }

  selectingStore.clearSelection();
};

// Функция открытия меню
const openCalendarMenu = (event, day) => {
  // Проверка перед открытием
  const beforeOpen = (data) => {
    if (!data.day.isCurrentMonth) return false;

    if (!selectedItems.value.has(data.day)) {
      selectingStore.clearSelection();
      selectingStore.startSelection(data.day);
      selectingStore.endSelection();
    }

    return true;
  };

  contextMenuStore.openMenu(event, {
    items: menuItems,
    data: { day },
    onAction: handleContextAction,
    beforeOpen,
  });
};

// Настраиваем store для работы с днями календаря
selectingStore.configure({
  // Функция для получения всех доступных дней
  itemsGetter: () => calendars.value,

  // Проверка, можно ли выбрать день (только дни текущего месяца)
  itemValidator: (day) => day && day.isCurrentMonth,

  // Сравнение дней по дате
  itemComparator: (day1, day2) => {
    if (!day1?.date || !day2?.date) return false;
    return day1.date.getTime() === day2.date.getTime();
  },

  // Выбор диапазона дней
  rangeSelector: (startDay, endDay) => {
    if (!startDay?.date || !endDay?.date) return [];

    const startDate = startDay.date;
    const endDate = endDay.date;

    const start = new Date(Math.min(startDate.getTime(), endDate.getTime()));
    const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));

    const selectedDays = [];
    for (let i = start.getDate(); i <= end.getDate(); i++) {
      const day = calendars.value.find((d) => {
        if (d.isCurrentMonth) return d.date.getDate() === i;
        else return false;
      });

      if (day) {
        selectedDays.push(day);
      }
    }

    return selectedDays;
  },
});

const onMouseDown = (event) => {
  // Только левая кнопка мыши
  if (event.button !== 0) return;
};

const onMouseUp = (event) => {
  if (event.button !== 0) return;

  selectingStore.endSelection();
};

const onMouseLeave = () => {
  selectingStore.endSelection();
};

const onDayMouseDown = (day, event) => {
  if (event.button !== 0) return;

  // Если зажат Shift, используем специальную логику
  if (event.shiftKey) {
    selectingStore.startSelection(day, true);
  } else if (event.ctrlKey) {
    selectingStore.startSelection(day, false, true);
  } else {
    selectingStore.startDragSelection(day);
  }
};

const onDayMouseEnter = (day) => {
  // Обновляем выделение при перетаскивании
  if (selectingStore.isDragging) {
    selectingStore.updateDragSelection(day);
  }
};

const clearKeyboard = (e) => {
  if (e.key == "Escape") {
    selectingStore.clearSelection();
    contextMenuStore.contextClose();
  }
};

document.addEventListener("keydown", clearKeyboard);

onUnmounted(() => {
  selectingStore.clearSelection();
  document.removeEventListener("keydown", clearKeyboard);
});
</script>

<style scoped>
.calendar {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: 3rem;
  grid-auto-rows: 1fr;
  height: 100%;
  overflow: auto;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
</style>
