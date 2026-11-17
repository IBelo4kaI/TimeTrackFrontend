import { timeTrackApi } from './api'

export const getDepartmentManagers = async () => (await timeTrackApi.get('/department-managers')).data
export const getDepartmentManagerCandidates = async () => (await timeTrackApi.get('/department-managers/employees')).data
export const createDepartmentManager = async (data) => (await timeTrackApi.post('/department-managers', data)).data
export const deleteDepartmentManager = async (id) => timeTrackApi.delete(`/department-managers/${id}`)
export const syncDepartmentManagerRole = async (id) => (await timeTrackApi.post(`/department-managers/${id}/sync-role`)).data
