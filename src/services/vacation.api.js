import { timeTrackApi } from './api'

export const uploadVacationFile = async (vacationId, file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await timeTrackApi.post(
      `/vacation/${vacationId}/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('Ошибка при загрузке файла отпуска:', error)
    throw error
  }
}

export const downloadVacationFile = async (fileName) => {
  try {
    const response = await timeTrackApi.get(`/vacation/file`, {
      params: { fileName },
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при получении файла отпуска:', error)
    throw error
  }
}

export const deleteVacationFile = async (fileName, vacationId) => {
  try {
    const response = await timeTrackApi.delete(`/vacation/file`, {
      params: { fileName, vacationId },
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении файла отпуска:', error)
    throw error
  }
}

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
