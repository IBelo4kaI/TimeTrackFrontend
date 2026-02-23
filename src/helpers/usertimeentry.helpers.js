import { parseDateStartDay } from '@/utils/date.utils'

export const createUpdatesObjects = (daysToProcess, config, userId) => {
  const updates = {
    toUpdate: { userId: userId, entities: [] },
    toCreate: { userId: userId, entities: [] },
  }

  // Обрабатываем каждый день
  daysToProcess.forEach((day) => {
    // Определяем dayTypeId
    const dayTypeId = day.isEditType
      ? config.userTimeTypeId
      : day.userTimeTypeId

    // Формируем базовые данные
    const baseData = {
      dayTypeId: dayTypeId,
      entryDate: parseDateStartDay(day.date),
      hoursWorked: (config.hours ?? day.hours).toString(),
    }

    // Разделяем на обновление и создание
    if (day.userTimeId && day.userTimeId != '') {
      console.log(day)
      updates.toUpdate.entities.push(baseData)
    } else {
      console.log(day)
      updates.toCreate.entities.push(baseData)
    }
  })

  return updates
}
