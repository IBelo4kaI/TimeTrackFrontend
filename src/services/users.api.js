import { SERVICE_ID } from '@/constants/api.constants'
import { permissionsApi } from './api'

export const getMe = async () => {
  try {
    const response = await permissionsApi.get(`/users/me`)

    return response.data
  } catch (error) {
    console.error('Error fetching calendar days:', error)
    throw error
  }
}

export const getMePermissions = async () => {
  try {
    const response = await permissionsApi.get(
      `/users/me/permissions/${SERVICE_ID}`
    )

    return response.data
  } catch (error) {
    console.error('Error fetching calendar days:', error)
    throw error
  }
}

export const getAllUsers = async () => {
  try {
    const response = await permissionsApi.get(`/users/all`)

    return response?.data
  } catch (error) {
    console.error('Error fetching calendar days:', error)
    throw error
  }
}
