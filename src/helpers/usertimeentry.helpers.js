import { parseDateStartDay } from '@/utils/date.utils'

const hasEntry = (day) => day.userTimeId && day.userTimeId !== ''

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
      // undefined — оставить как есть, null — сбросить
      workLocation:
        day.isEditType && config.workLocation !== undefined
          ? config.workLocation
          : day.workLocation || null,
    }

    // Разделяем на обновление и создание
    if (day.userTimeId && day.userTimeId != '') {
      updates.toUpdate.entities.push(baseData)
    } else {
      updates.toCreate.entities.push(baseData)
    }
  })

  return updates
}

// Очистка дней: обычные записи удаляем, у отпуска только обнуляем часы
export const clearDays = async (days, calendarStore, dayTypesStore) => {
  const vacationTypeId = dayTypesStore.getDayTypeIdByName('vacation')
  const entries = days.filter(hasEntry)

  const dates = entries
    .filter((day) => day.userTimeTypeId != vacationTypeId)
    .map((day) => parseDateStartDay(day.date))

  if (dates.length > 0) {
    await calendarStore.deleteDay({
      userId: calendarStore.selectedUserId,
      entryDate: dates,
    })
  }

  const vacationDays = entries.filter(
    (day) => day.userTimeTypeId == vacationTypeId
  )

  if (vacationDays.length > 0) {
    const updates = createUpdatesObjects(
      vacationDays,
      { userTimeTypeId: vacationTypeId, hours: 0 },
      calendarStore.selectedUserId
    )
    await calendarStore.updateDay(updates.toUpdate, updates.toCreate)
  }
}

// Действие контекстного меню календаря над выбранными днями
export const applyDayAction = async (
  action,
  days,
  calendarStore,
  dayTypesStore
) => {
  if (action === 'clear') {
    await clearDays(days, calendarStore, dayTypesStore)
    return
  }

  const configs = {
    medical: { type: 'medical', hours: null, workLocation: null },
    decree: { type: 'decree', hours: null, workLocation: null },
    'time-off': { type: 'time-off', hours: null, workLocation: null },
    standardWork: { type: 'work', hours: 8 },
  }
  const config = configs[action]
  if (!config) return

  const updates = createUpdatesObjects(
    days,
    {
      userTimeTypeId: dayTypesStore.getDayTypeIdByName(config.type),
      hours: config.hours,
      workLocation: config.workLocation,
    },
    calendarStore.selectedUserId
  )
  await calendarStore.updateDay(updates.toUpdate, updates.toCreate)
}
