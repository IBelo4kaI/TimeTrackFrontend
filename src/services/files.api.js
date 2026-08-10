import { timeTrackApi } from './api'

// year — необязательный фильтр по году загрузки файла. Без него бэкенд
// возвращает файлы за все годы (как и раньше).
export const getEntityFiles = async (entityType, entityId, year) => {
  const response = await timeTrackApi.get(
    `/files/entity/${entityType}/${entityId}`,
    { params: year ? { year } : undefined }
  )
  return response.data
}

export const getEntityTypeFiles = async (entityType, year) => {
  const response = await timeTrackApi.get(`/files/entity/${entityType}`, {
    params: year ? { year } : undefined,
  })
  return response.data
}

export const getCategoryFiles = async (categoryId, year) => {
  const response = await timeTrackApi.get(`/files/category/${categoryId}`, {
    params: year ? { year } : undefined,
  })
  return response.data
}

export const openFile = async (id) => {
  const response = await timeTrackApi.get(`/files/open/${id}`, {
    responseType: 'blob',
  })
  return response.data
}

export const deleteFile = async (id) => {
  const response = await timeTrackApi.delete(`/files/${id}`)
  return response.data
}
