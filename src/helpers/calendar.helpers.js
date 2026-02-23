import { useCalendarStore } from '@/stores/calendar'
import { storeToRefs } from 'pinia'
import { getDayOfWeek, getLastDateOfMonth } from '../utils/calendar.utils'

/**
 * Сгенерировать дни с offset
 */
export const generateDaysWithOffset = (baseDate, offsetDays) => {
  const days = []

  for (let i = 0; i < offsetDays; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i)
    days.push({ date: date })
  }

  return days
}

export const generateDaysAfterDate = (targetDate) => {
  const date = new Date(targetDate)
  const lastDate = getLastDateOfMonth(date)

  if (date == lastDate) return []

  date.setDate(date.getDate() + 1)

  return generateDaysWithOffset(date, lastDate.getDate() - date.getDate() + 1)
}

export const generateDaysBeforeDate = (targetDate) => {
  const date = new Date(targetDate)
  const dateNumber = date.getDate()

  if (dateNumber == 1) return []

  date.setDate(1)

  return generateDaysWithOffset(date, dateNumber - 1)
}

/**
 * Сгенерировать дни предыдущего месяца
 */
export const generatePrevMonthDays = (firstDate) => {
  const firstDay = getDayOfWeek(firstDate)
  if (firstDay === 1) return []

  const daysCount = firstDay - 1
  const startDate = new Date(firstDate)
  startDate.setDate(startDate.getDate() - daysCount)

  return generateDaysWithOffset(startDate, daysCount)
}

/**
 * Сгенерировать дни следующего месяца
 */
export const generateNextMonthDays = (lastDate) => {
  const lastDay = getDayOfWeek(lastDate)
  if (lastDay === 7) return []

  const daysCount = 7 - lastDay
  const startDate = new Date(lastDate)
  startDate.setDate(startDate.getDate() + 1)

  return generateDaysWithOffset(startDate, daysCount)
}

/**
 * Обновить дни
 */
export const updateDayInReports = (day) => {
  const calendarStore = useCalendarStore()
  const { users } = storeToRefs(calendarStore)

  if (!users.value) users.value = []

  const index = users.value.findIndex(
    (report) =>
      report.day === day.day &&
      report.month === day.month &&
      report.year === day.year
  )

  if (index !== -1) {
    // Обновляем существующую запись
    users.value[index] = {
      ...users.value[index],
      hasData: true,
      hours: day.hours,
      typeId: day.typeId,
      typeSystemName: day.typeSystemName,
    }
  } else {
    // Добавляем новую запись
    users.value.push({
      id: day.id,
      day: day.day,
      month: day.month,
      hasData: true,
      year: day.year,
      hours: day.hours,
      typeId: day.typeId,
      typeSystemName: day.typeSystemName,
    })
  }
}

/**
 * Обновить дни
 */
export const deleteDayInReports = (day) => {
  const calendarStore = useCalendarStore()
  const { users } = storeToRefs(calendarStore)

  if (!users.value) users.value = []

  const dayFind = users.value.find(
    (report) =>
      report.day === day.date.getDate() &&
      report.month === day.date.getMonth() + 1 &&
      report.year === day.date.getFullYear()
  )

  if (dayFind) {
    // Обновляем существующую запись
    users.value = users.value.filter((report) => report != dayFind)
  }
}
