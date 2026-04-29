import { timeTrackApi } from './api'

export const getSickLeavesByYear = async (year, userId) => {
  const response = await timeTrackApi.get(`/sick-leaves/${userId}/${year}`)
  return response.data
}

export const getAllUsersSickLeavesByYear = async (year) => {
  const response = await timeTrackApi.get(`/sick-leaves/all/${year}`)
  return response.data
}

export const createSickLeave = async (data) => {
  const response = await timeTrackApi.post('/sick-leaves/create', data)
  return response.data
}

export const updateSickLeaveStatus = async (id, status) => {
  const response = await timeTrackApi.put(`/sick-leaves/${id}/status`, { status })
  return response.data
}

export const deleteSickLeave = async (id) => {
  const response = await timeTrackApi.delete(`/sick-leaves/${id}`)
  return response.data
}

export const uploadSickLeaveFile = async (sickLeaveId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await timeTrackApi.post(`/sick-leaves/${sickLeaveId}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const downloadSickLeaveFile = async (fileName) => {
  const response = await timeTrackApi.get('/sick-leaves/file', {
    params: { fileName },
    responseType: 'blob',
  })
  return response.data
}

export const deleteSickLeaveFile = async (fileName, sickLeaveId) => {
  const response = await timeTrackApi.delete('/sick-leaves/file', {
    params: { fileName, sickLeaveId },
  })
  return response.data
}
