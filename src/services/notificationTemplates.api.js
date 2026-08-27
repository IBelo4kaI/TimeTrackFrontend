import { timeTrackApi } from './api'

export const getNotificationTemplates = async () => {
  try {
    const response = await timeTrackApi.get('/notification-templates')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении шаблонов уведомлений:', error)
    throw error
  }
}

export const createNotificationTemplate = async (data) => {
  try {
    const response = await timeTrackApi.post('/notification-templates', data)
    return response.data
  } catch (error) {
    console.error('Ошибка при создании шаблона уведомления:', error)
    throw error
  }
}

export const updateNotificationTemplate = async (id, data) => {
  try {
    const response = await timeTrackApi.put(`/notification-templates/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Ошибка при обновлении шаблона уведомления:', error)
    throw error
  }
}

export const deleteNotificationTemplate = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/notification-templates/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении шаблона уведомления:', error)
    throw error
  }
}
