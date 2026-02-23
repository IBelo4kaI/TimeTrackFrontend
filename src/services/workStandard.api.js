import { timeTrackApi } from './api'

export const getStandardsByYear = async (year) => {
  try {
    const response = await timeTrackApi.get(`/work-standards/year/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    throw error
  }
}

export const createStandard = async (standardData) => {
  try {
    const response = await timeTrackApi.post('/work-standards', standardData)
    return response.data
  } catch (error) {
    console.error('Ошибка при создании стандарта:', error)
    throw error
  }
}

export const updateStandard = async (id, updateData) => {
  try {
    const response = await timeTrackApi.put(`/work-standards/${id}`, updateData)
    return response.data
  } catch (error) {
    console.error('Ошибка при обновлении стандарта:', error)
    throw error
  }
}
