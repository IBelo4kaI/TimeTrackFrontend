// Определяет числовой id пола пользователя из разных возможных форм,
// в которых он может прийти с бэка/сервиса пользователей: вложенный объект
// {id}, числовое/строковое поле genderId, либо строка на русском/английском.
// Вынесено из stores/report.js — та же логика нужна и для карточки
// сотрудника (stores/worker.js).
export const parseGenderId = (user) => {
  const rawGender = user?.gender?.id ?? user?.genderId ?? user?.gender

  if (typeof rawGender === 'number') return rawGender
  if (typeof rawGender === 'string') {
    const normalizedGender = rawGender.trim().toLowerCase()
    if (['2', 'female', 'f', 'жен', 'женский'].includes(normalizedGender)) {
      return 2
    }
    if (['1', 'male', 'm', 'муж', 'мужской'].includes(normalizedGender)) {
      return 1
    }
  }

  return null
}

// getInternalEmployees() (services/reference.api.js) отдаёт либо плоский
// список сотрудников, либо список групп {department, employees: [...]} —
// приводим к единому плоскому списку. Вынесено из stores/report.js.
export const flattenInternalEmployees = (raw) => {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) =>
    Array.isArray(item?.employees) ? item.employees : [item]
  )
}
