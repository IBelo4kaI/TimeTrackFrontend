import { timeTrackApi } from './api'

// @ expample = [
//     {
//       userId: 1,
//       entryDate: 1,
//       dayTypeId: 1,
//       hoursWorked: 1,
//     },
//   ]
export const createUserTimeEntry = async (dayData) => {
  try {
    const response = await timeTrackApi.post('/usertimeentries/create', dayData)
    if (response.status == 201) return true
  } catch (error) {
    console.error('Ошибка создания дня:', error)
    throw error
  }
}

export const updateUserTimeEntry = async (dayData) => {
  try {
    const response = await timeTrackApi.post('/usertimeentries/update', dayData)
    if (response.status == 204) return true
  } catch (error) {
    console.error('Ошибка обновления дня:', error)
    throw error
  }
}

export const deleteUserTimeEntry = async (dayData) => {
  try {
    const response = await timeTrackApi.post('/usertimeentries/delete', dayData)
    if (response.status == 204) return true
  } catch (error) {
    console.error('Ошибка удаления дня:', error)
    throw error
  }
}

export const getStatistics = async (userId, month, year, gender) => {
  try {
    const response = await timeTrackApi.get(
      `/usertimeentries/statistics/${userId}/${year}/${month}/${gender}`
    )

    return response.data
  } catch (error) {
    console.error('Ошибка получения статистики:', error)
    throw error
  }
}
