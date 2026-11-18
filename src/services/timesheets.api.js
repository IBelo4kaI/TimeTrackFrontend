import { referenceApi, timeTrackApi } from './api'

export const getTimesheets = async (year, month, config) => {
  const response = await timeTrackApi.get(`/timesheets/${year}/${month}`, config)
  return response.data
}

export const setTimesheetApproval = async (userId, year, month, expectedRevision, approve) => {
  const action = approve ? 'approve' : 'unapprove'
  const response = await timeTrackApi.post(
    `/timesheets/${encodeURIComponent(userId)}/${year}/${month}/${action}`,
    { expectedRevision }
  )
  return response.data
}

// Optional labels must not block the report indefinitely or fall back to mocks.
export const getTimesheetDirectory = async () => {
  const response = await referenceApi.get('/ref/employees/internal', { timeout: 5000 })
  return response.data
}

const monthPath = (userId, year, month) => `/timesheets/${encodeURIComponent(userId)}/${year}/${month}`

export const getTimesheetMonth = async (userId, year, month) => {
  const response = await timeTrackApi.get(monthPath(userId, year, month), { timeout: 10000 })
  return response.data
}
export const getTimeEntryHistory = async (userId, year, month) => {
  const response = await timeTrackApi.get(`${monthPath(userId, year, month)}/history`, { timeout: 10000 })
  return response.data
}
export const editTimesheetEntries = async (userId, year, month, operation, entities, comment) => {
  await timeTrackApi.put(`${monthPath(userId, year, month)}/entries`, { operation, entities, comment })
}
