import { useNotificationStore } from '@/stores/notification'
import axios from 'axios'
import { useRouter } from 'vue-router'

// Создаем экземпляр Axios с базовым URL
export const timeTrackApi = axios.create({
  baseURL: 'http://localhost:8080/v1',
  withCredentials: true,
})

export const permissionsApi = axios.create({
  baseURL: 'http://localhost:8382/api/as',
  withCredentials: true,
})

permissionsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status == 401) {
      window.location.href = 'https://sso.st29.ru'
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
      window.location.href = 'https://sso.st29.ru'
      return
    } else if (error.response?.status == 403) {
      notstore.addNotification('Нет доступа к действию', 'error')
      return error
      // window.location.href = '/'
    }
    return Promise.reject(error)
  }
)
