import { timeTrackApi } from './api'

export const getVacationStats = async (year, userId) => {
  try {
    const response = await timeTrackApi.get(`/vacation/stats/${userId}/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    throw error
  }
}

export const getVacationsByYear = async (year, userId) => {
  try {
    const response = await timeTrackApi.get(`/vacation/${userId}/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    throw error
  }
}

export const getAllUserVacationsByYear = async (year) => {
  try {
    const response = await timeTrackApi.get(`/vacation/all/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    throw error
  }
}

export const createVacation = async (data) => {
  try {
    const response = await timeTrackApi.post('/vacation/create', data)
    return response.data
  } catch (error) {
    console.error('Ошибка создания отпуска:', error)
    throw error
  }
}

export const updateVacationStatus = async (id, status) => {
  try {
    const response = await timeTrackApi.put(`/vacation/${id}/status`, {
      status: status,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка создания дня:', error)
    throw error
  }
}

export const approvedVacationStatus = async (id) => {
  try {
    const response = await timeTrackApi.put(`/vacation/${id}/approve`)
    return response.data
  } catch (error) {
    console.error('Ошибка создания дня:', error)
    throw error
  }
}

export const deleteVacation = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/vacation/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка создания дня:', error)
    throw error
  }
}
