import { timeTrackApi } from './api'

export const getMyBusinessCards = async () => {
  try {
    const response = await timeTrackApi.get('/business-cards/my')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении карт:', error)
    throw error
  }
}

export const getAllBusinessCards = async () => {
  try {
    const response = await timeTrackApi.get('/business-cards/all')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении всех карт:', error)
    throw error
  }
}

export const getBusinessCardById = async (id) => {
  try {
    const response = await timeTrackApi.get(`/business-cards/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при получении карты:', error)
    throw error
  }
}

// data: { number, label, bank, holderName, expiry, cardLimit (копейки), status }
export const createBusinessCard = async (data) => {
  try {
    const response = await timeTrackApi.post('/business-cards', data)
    return response.data
  } catch (error) {
    console.error('Ошибка при создании карты:', error)
    throw error
  }
}

// Пустой number оставляет номер прежним.
export const updateBusinessCard = async (id, data) => {
  try {
    const response = await timeTrackApi.put(`/business-cards/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Ошибка при обновлении карты:', error)
    throw error
  }
}

export const deleteBusinessCard = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/business-cards/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении карты:', error)
    throw error
  }
}

export const assignBusinessCard = async (id, userId) => {
  try {
    const response = await timeTrackApi.post(`/business-cards/${id}/assign`, {
      userId,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при выдаче карты:', error)
    throw error
  }
}

export const releaseBusinessCard = async (id) => {
  try {
    const response = await timeTrackApi.post(`/business-cards/${id}/release`)
    return response.data
  } catch (error) {
    console.error('Ошибка при снятии карты с сотрудника:', error)
    throw error
  }
}

export const getBusinessCardHistory = async (id) => {
  try {
    const response = await timeTrackApi.get(`/business-cards/${id}/history`)
    return response.data
  } catch (error) {
    console.error('Ошибка при получении истории карты:', error)
    throw error
  }
}

// Полный номер карты — только для business_cards.all:read.
export const getBusinessCardNumber = async (id) => {
  try {
    const response = await timeTrackApi.get(`/business-cards/${id}/number`)
    return response.data
  } catch (error) {
    console.error('Ошибка при получении номера карты:', error)
    throw error
  }
}

export const getReceiptsByBusinessCard = async (id) => {
  try {
    const response = await timeTrackApi.get(`/receipts/card/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при получении чеков по карте:', error)
    throw error
  }
}
