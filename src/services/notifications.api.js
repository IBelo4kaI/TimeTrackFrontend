import { timeTrackApi } from './api'

export const getNotifications = async ({ limit = 30, offset = 0 } = {}) => {
  try {
    const response = await timeTrackApi.get('/notifications', { params: { limit, offset } })
    return response.data
  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error)
    throw error
  }
}

export const getUnreadNotificationsCount = async () => {
  try {
    const response = await timeTrackApi.get('/notifications/unread-count')
    return response.data?.count ?? 0
  } catch (error) {
    console.error('Ошибка при получении счётчика уведомлений:', error)
    throw error
  }
}

export const markNotificationRead = async (id) => {
  try {
    await timeTrackApi.put(`/notifications/${id}/read`)
  } catch (error) {
    console.error('Ошибка при отметке уведомления прочитанным:', error)
    throw error
  }
}

export const markAllNotificationsRead = async () => {
  try {
    await timeTrackApi.put('/notifications/read-all')
  } catch (error) {
    console.error('Ошибка при отметке всех уведомлений прочитанными:', error)
    throw error
  }
}

export const deleteNotification = async (id) => {
  try {
    await timeTrackApi.delete(`/notifications/${id}`)
  } catch (error) {
    console.error('Ошибка при удалении уведомления:', error)
    throw error
  }
}

export const deleteAllNotifications = async () => {
  try {
    await timeTrackApi.delete('/notifications')
  } catch (error) {
    console.error('Ошибка при очистке уведомлений:', error)
    throw error
  }
}
