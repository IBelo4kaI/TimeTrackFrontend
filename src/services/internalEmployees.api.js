import { referenceApi } from './api'

// Административный баланс не должен использовать mock-fallback справочника.
export const getInternalEmployees = async () => {
  try {
    const response = await referenceApi.get('/ref/employees/internal')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении справочника для баланса отпусков:', error)
    throw error
  }
}
