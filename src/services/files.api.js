import { timeTrackApi } from './api'

export const getEntityFiles = async (entityType, entityId) => {
  const response = await timeTrackApi.get(`/files/entity/${entityType}/${entityId}`)
  return response.data
}

export const openFile = async (id) => {
  const response = await timeTrackApi.get(`/files/open/${id}`, { responseType: 'blob' })
  return response.data
}

export const deleteFile = async (id) => {
  const response = await timeTrackApi.delete(`/files/${id}`)
  return response.data
}
