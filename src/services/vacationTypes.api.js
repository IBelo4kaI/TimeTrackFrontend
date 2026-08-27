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

export const createVacationType = async (data) => {
  try {
    const response = await timeTrackApi.post('/vacation-types', data)
    return response.data
  } catch (error) {
    console.error('Ошибка при создании типа отпуска:', error)
    throw error
  }
}

export const updateVacationType = async (id, data) => {
  try {
    const response = await timeTrackApi.put(`/vacation-types/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Ошибка при обновлении типа отпуска:', error)
    throw error
  }
}

export const deleteVacationType = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/vacation-types/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении типа отпуска:', error)
    throw error
  }
}
