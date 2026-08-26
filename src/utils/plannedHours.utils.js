// Плановое количество часов за месяц (уже отработано + плановая
// отработка) — для страницы календаря. Считаем на фронте: для каждого дня
// месяца без отметки (userTimeId пуст) на рабочий день добавляем норму
// часов на день, для дня с отметкой — фактические часы (что бы там ни было
// отмечено — работа/отпуск/больничный), для выходного/праздника без
// отметки — 0. Работает одинаково для прошлых и будущих дней месяца.

const DEFAULT_DAILY_HOURS = 8 // мужчины всегда, женщины кроме пятницы
const FEMALE_FRIDAY_HOURS = 6

const GENDER_FEMALE = 2

// dailyNorm — часы нормы на конкретный рабочий день.
// individualStandard — строка work_standards с user_id = этот сотрудник за
// этот месяц (если есть) — там standardHours/standardDays это часы/дни ЗА
// ВЕСЬ МЕСЯЦ (та же форма, что и у общих норм — см. StandardSettings.vue),
// поэтому дневная норма — их отношение, без пятничного исключения. Без
// индивидуального графика — 8ч, у женщин по пятницам 6ч.
export function dailyNorm(date, genderId, individualStandard) {
  if (individualStandard?.standardDays) {
    return individualStandard.standardHours / individualStandard.standardDays
  }
  if (genderId === GENDER_FEMALE && date.getDay() === 5) {
    return FEMALE_FRIDAY_HOURS
  }
  return DEFAULT_DAILY_HOURS
}

// plannedMonthHours — сумма по всем дням месяца (см. описание выше).
// days — calendarStore.calendarDays (date/hours/userTimeId/isWeekend).
export function plannedMonthHours(days, genderId, individualStandard) {
  let total = 0
  for (const day of days) {
    if (day.userTimeId) {
      total += day.hours ?? 0
    } else if (!day.isWeekend) {
      total += dailyNorm(new Date(day.date), genderId, individualStandard)
    }
  }
  return total
}

// vacationNormHours — сколько часов нормы приходится на дни отпуска в этом
// месяце (по рабочим дням внутри отпуска). Нужно, чтобы вычесть их из
// нормы месяца перед расчётом "Недоработка/Переработка" — иначе отпуск
// всегда выглядел бы как недоработка, хотя остальные дни отработаны как надо.
export function vacationNormHours(days, vacationTypeId, genderId, individualStandard) {
  if (!vacationTypeId) return 0

  let total = 0
  for (const day of days) {
    if (day.userTimeTypeId === vacationTypeId && !day.isWeekend) {
      total += dailyNorm(new Date(day.date), genderId, individualStandard)
    }
  }
  return total
}
