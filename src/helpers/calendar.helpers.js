import { getDayOfWeek } from '../utils/calendar.utils'

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
