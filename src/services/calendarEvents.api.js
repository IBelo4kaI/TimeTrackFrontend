import { timeTrackApi } from './api'

export const getCalendarEventForYear = async (year) => {
  try {
    const response = await timeTrackApi.get(`/calendar-events/year/${year}`)
    return response.data
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    throw error
  }
}

export const createCalendarEvent = async (data) => {
  try {
    const response = await timeTrackApi.post('/calendar-events', data)
    return response.data
  } catch (error) {
    console.error('Error creating calendar event:', error)
    throw error
  }
}
