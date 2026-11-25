import { timeTrackApi } from './api'

export const getSickLeavesByYear = async (year, userId) => {
  const response = await timeTrackApi.get(`/sick-leaves/${userId}/${year}`)
  return response.data
}
