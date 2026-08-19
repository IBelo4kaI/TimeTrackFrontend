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

function handleAuthErrors(error) {
  if (error.response?.status == 401) {
    window.location.href = 'https://sso.st29.ru/?url=timetrack.st29.ru'
  } else if (error.response?.status == 403 && error.config?.notifyOn403) {
    useNotificationStore().addNotification('Нет доступа к действию', 'error')
  }
  return Promise.reject(error)
}

permissionsApi.interceptors.response.use(
  (response) => response,
  handleAuthErrors
)
timeTrackApi.interceptors.response.use((response) => response, handleAuthErrors)
