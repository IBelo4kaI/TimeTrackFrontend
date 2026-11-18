import { timeTrackApi } from './api'

export const getCalendarDays = async (month, year, userId) => {
  try {
    const response = await timeTrackApi.get(
      `/calendar/${encodeURIComponent(userId)}/${year}/${month}`
    )

    return response.data
  } catch (error) {
    console.error('Error fetching calendar days:', error)
    throw error
  }
}
