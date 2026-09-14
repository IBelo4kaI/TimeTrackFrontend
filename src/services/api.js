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

// Бэк кладёт текст ошибки в тело ответа — ключ "error" почти everywhere
// (см. internal/response/response.go), но у отказов по правам доступа
// (internal/middleware/permission.go) это "message". error.message у самого
// axios — это generic "Request failed with status code 409", а не то, что
// реально написано на бэке, поэтому подменяем его, если в ответе есть текст.
function extractServerMessage(error) {
  const data = error.response?.data
  const message = data?.error || data?.message
  if (typeof message === 'string' && message) {
    error.message = message
  }
}

function handleAuthErrors(error) {
  extractServerMessage(error)

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
