import { timeTrackApi } from './api'

export const getVKStatus = async () => {
  try {
    const response = await timeTrackApi.get('/vk/status')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении статуса привязки VK:', error)
    throw error
  }
}

export const generateVKLinkCode = async () => {
  try {
    const response = await timeTrackApi.post('/vk/link-code')
    return response.data
  } catch (error) {
    console.error('Ошибка при генерации кода привязки VK:', error)
    throw error
  }
}

export const unlinkVK = async () => {
  try {
    const response = await timeTrackApi.delete('/vk/link')
    return response.data
  } catch (error) {
    console.error('Ошибка при отвязке VK:', error)
    throw error
  }
}
