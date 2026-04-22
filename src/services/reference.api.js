import { referenceApi } from './api'

export const getInternalEmployees = async () => {
  try {
    const response = await referenceApi.get('/ref/employees/internal')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении сотрудников:', error)
    throw error
  }
}

export const getInternalEmployeeDepartments = async () => {
  try {
    const response = await referenceApi.get('/ref/employees/internal/departments')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении отделов сотрудников:', error)
    throw error
  }
}
