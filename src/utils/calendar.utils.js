// utils/calendar.utils.js
import {
  DAY_NAMES,
  DAY_NAMES_SHORT,
  MONTH_NAMES,
  MONTH_NAMES_GENITIVE,
  TYPE_LABELS,
} from '../constants/calendar.constants'

/**
 * Получить текстовое название типа
 */
export const getTypeLabel = (type) => TYPE_LABELS[type] || type

/**
 * Получить день недели (1-7, где 1 - понедельник)
 */
export const getDayOfWeek = (date) => {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

/**
 * Проверить, является ли дата сегодняшней
 */
export const isCurrentDate = (date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Получить название даты (например: "15 Января")
 */
export const getDateNamed = (date) => {
  return `${date.getDate()} ${MONTH_NAMES_GENITIVE[date.getMonth()]}`
}

/**
 * Получить название дня недели
 */
export const getDayOfWeekNamed = (date, isShort = true) => {
  if (isShort) return DAY_NAMES_SHORT[getDayOfWeek(date) - 1]
  else return DAY_NAMES[getDayOfWeek(date) - 1]
}

/**
 * Проверить, является ли день выходным
 */
export const isWeekend = (date, type) => {
  if (date == null) {
    return false
  } else if (type != null) {
    if (type === 'weekend') {
      return true
    }

    if (type === 'preholiday') {
      return false
    }

    return getDayOfWeek(date) === 6 || getDayOfWeek(date) === 7
  } else {
    return getDayOfWeek(date) === 6 || getDayOfWeek(date) === 7
  }
}

/**
 * Получить первый день месяца
 */
export const getFirstDateOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Получить последний день месяца
 */
export const getLastDateOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export const getFullDate = (date) => {
  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  }
}

export const getMonthYearName = (date) => {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}
