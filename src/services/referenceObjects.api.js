import { referenceApi } from './api'

// Объекты (стройплощадки/проекты) Reference Service — на них привязываются
// чеки (см. receipt.objectId). Название у большинства только short_name,
// full_name/address чаще пустые.
export const getObjects = async () => {
  try {
    const response = await referenceApi.get('/ref/objects')
    return response.data ?? []
  } catch (error) {
    console.error('Ошибка при получении объектов:', error)
    throw error
  }
}

// Для быстрого создания прямо из чека хватает short_name; is_active — сразу
// true, иначе объект будет считаться закрытым.
export const createObject = async (shortName) => {
  try {
    const response = await referenceApi.post('/ref/objects', {
      short_name: shortName,
      is_active: true,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при создании объекта:', error)
    throw error
  }
}
