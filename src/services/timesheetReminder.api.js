import { timeTrackApi } from './api'

// Ручной прогон проверки "кто не заполнил табель" — не дожидаясь суточного
// тикера на бэке (см. internal/timesheetreminder). Возвращает { message,
// sent } — sent — скольким реально ушло уведомление.
export const runTimesheetReminderCheck = async () => {
  try {
    const response = await timeTrackApi.post('/timesheet-reminder/run')
    return response.data
  } catch (error) {
    console.error('Ошибка при запуске проверки табелей:', error)
    throw error
  }
}
