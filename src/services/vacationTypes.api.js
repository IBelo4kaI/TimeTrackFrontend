import { timeTrackApi } from './api'

export const getVacationTypes = async () => {
  try {
    const response = await timeTrackApi.get('/vacation-types')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении типов отпусков:', error)
    throw error
  }
}

export const getActiveVacationTypes = async () => {
  try {
    const response = await timeTrackApi.get('/vacation-types/active')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении типов отпусков:', error)
    throw error
  }
}
