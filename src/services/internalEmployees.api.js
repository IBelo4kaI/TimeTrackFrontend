import { referenceApi } from './api'
import { getInternalEmployees as getDevelopmentEmployees } from './reference.api'

// Mock-fallback существующего справочника доступен только в разработке.
export const getInternalEmployees = async () => {
  if (import.meta.env.DEV) return getDevelopmentEmployees()

  try {
    const response = await referenceApi.get('/ref/employees/internal')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении справочника для баланса отпусков:', error)
    throw error
  }
}
