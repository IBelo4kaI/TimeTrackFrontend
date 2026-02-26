// Утилиты для работы с датами в компонентах отпусков

// Форматирование даты для tooltip: "01.01.2024"
export function formatDateForTooltip(dateStr) {
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number)
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`
}

// Парсим "2024-03-01" как локальную дату, а не UTC.
// new Date("2024-03-01") → UTC midnight → в UTC+3 это 2024-02-29T21:00:00 → сдвиг на день
export function parseLocalDate(str) {
  const [y, m, d] = str.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function diffDays(a, b) {
  return Math.round((b - a) / 86400000)
}

export function clamp(date, min, max) {
  if (date < min) return min
  if (date > max) return max
  return date
}

// toISOString() возвращает UTC — в UTC+3 дата может съехать на день назад.
// Собираем строку из локальных компонентов даты.
export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function formatMonth(date) {
  return date
    .toLocaleString('ru', { month: 'short' })
    .toUpperCase()
    .replace('.', '')
}

export function isWeekend(date) {
  const d = date.getDay()
  return d === 0 || d === 6
}

export function getInitials(fullname) {
  return (fullname || '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

// Перевод статуса на русский
export function getStatusInRussian(status) {
  const statusMap = {
    approved: 'утвержден',
    rejected: 'отклонен',
    pending: 'на рассмотрении',
  }
  return statusMap[status] || status
}
