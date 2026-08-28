import { timeTrackApi } from './api'

export const getNews = async () => {
  try {
    const response = await timeTrackApi.get('/news')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении новостей:', error)
    throw error
  }
}

export const getNewsUnreadCount = async () => {
  try {
    const response = await timeTrackApi.get('/news/unread-count')
    return response.data?.count ?? 0
  } catch (error) {
    console.error('Ошибка при получении счётчика новостей:', error)
    throw error
  }
}

export const markNewsSeen = async () => {
  try {
    await timeTrackApi.post('/news/mark-seen')
  } catch (error) {
    console.error('Ошибка при отметке новостей прочитанными:', error)
    throw error
  }
}

export const createNewsPost = async (data) => {
  try {
    const response = await timeTrackApi.post('/news', data)
    return response.data
  } catch (error) {
    console.error('Ошибка при создании новости:', error)
    throw error
  }
}

export const updateNewsPost = async (id, data) => {
  try {
    const response = await timeTrackApi.put(`/news/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Ошибка при обновлении новости:', error)
    throw error
  }
}

export const deleteNewsPost = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/news/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении новости:', error)
    throw error
  }
}
