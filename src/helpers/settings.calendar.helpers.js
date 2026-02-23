import { useSettingCalendarStore } from "@/stores/settingCalendar";
import {
  getDayOfWeek,
  getFullDate,
  getLastDateOfMonth,
  isWeekend,
} from "@/utils/calendar.utils";
import { storeToRefs } from "pinia";

/**
 * Найти данные для даты
 */
export const findAPICalendarForDate = (date) => {
  const settingStore = useSettingCalendarStore();
  const { calendarsData } = storeToRefs(settingStore);

  const { day, month, year } = getFullDate(date);

  const calendarDay = findCalendarDay(calendarsData.value, day, month, year);

  if (calendarDay) {
    const dayType = calendarDay.typeSystemName ?? null;

    return {
      id: calendarDay.id,
      type: dayType,
      description: calendarDay.description ?? "",
      isPaidVacation: calendarDay.isPaidVacation,
      isWeekend: isWeekend(date, dayType),
    };
  }

  return createEmptyDayData(date);
};

/**
 * Поиск дня в календаре
 */
const findCalendarDay = (calendars, day, month, year) => {
  if (!calendars) return null;

  return calendars.find(
    (item) => item.day === day && item.month - 1 === month && item.year === year
  );
};

/**
 * Создать пустой день
 */
const createEmptyDayData = (date = null) => ({
  id: null,
  type: null,
  description: "",
  isWeekend: isWeekend(date, null),
  isPaidVacation: true,
});

/**
 * Сгенерировать дни предыдущего месяца
 */
export const generatePrevMonthDays = (firstDate) => {
  const firstDay = getDayOfWeek(firstDate);
  if (firstDay === 1) return [];

  const daysCount = firstDay - 1;
  const startDate = new Date(firstDate);
  startDate.setDate(startDate.getDate() - daysCount);

  return generateDaysWithOffset(startDate, daysCount, false);
};

/**
 * Сгенерировать дни текущего месяца
 */
export const generateCurrentMonthDays = (year, month) => {
  const days = [];
  const totalDays = getLastDateOfMonth(new Date(year, month)).getDate();

  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(year, month, i);
    const apiData = findAPICalendarForDate(date);
    days.push(createDayObject(date, apiData, true));
  }

  return days;
};

/**
 * Сгенерировать дни следующего месяца
 */
export const generateNextMonthDays = (lastDate) => {
  const lastDay = getDayOfWeek(lastDate);
  if (lastDay === 7) return [];

  const daysCount = 7 - lastDay;
  const startDate = new Date(lastDate);
  startDate.setDate(startDate.getDate() + 1);

  return generateDaysWithOffset(startDate, daysCount, false);
};

/**
 * Сгенерировать дни с offset
 */
const generateDaysWithOffset = (baseDate, offsetDays, isCurrentMonth) => {
  const days = [];
  const emptyData = createEmptyDayData();

  for (let i = 0; i < offsetDays; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    days.push(createDayObject(date, emptyData, isCurrentMonth));
  }

  return days;
};

/**
 * Создать день для отображения
 */
export const createDayObject = (date, apiData, isCurrentMonth = true) => ({
  date,
  isCurrentMonth,
  ...apiData,
});
