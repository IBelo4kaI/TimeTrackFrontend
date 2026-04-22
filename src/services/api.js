import { useNotificationStore } from '@/stores/notification'
import axios from 'axios'

// Создаем экземпляр Axios с базовым URL
export const timeTrackApi = axios.create({
  baseURL: '/apitime',
  withCredentials: true,
})

export const permissionsApi = axios.create({
  baseURL: '/api/as',
  withCredentials: true,
})

export const referenceApi = axios.create({
  baseURL: '/apiref',
  withCredentials: true,
})

permissionsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status == 401) {
      window.location.href = 'https://sso.st29.ru/?url=timetrack.st29.ru'
      return
    } else if (error.response?.status == 403) {
      // window.location.href = '/'
      return
    }
    return Promise.reject(error)
  }
)

timeTrackApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const notstore = useNotificationStore()
    if (error.response?.status == 401) {
      window.location.href = 'https://sso.st29.ru/?url=timetrack.st29.ru'
      return
    } else if (error.response?.status == 403) {
      notstore.addNotification('Нет доступа к действию', 'error')
      return error
      // window.location.href = '/'
    }
    return Promise.reject(error)
  }
)
