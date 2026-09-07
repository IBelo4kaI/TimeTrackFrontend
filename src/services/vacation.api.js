import { timeTrackApi } from './api'

export const uploadVacationFile = async (vacationId, file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await timeTrackApi.post(
      `/vacation/${vacationId}/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('Ошибка при загрузке файла отпуска:', error)
    throw error
  }
}

// Считает totalVacationDays с учётом праздничных дней (см. GetCalendarEventsByDate
// + affects_vacation на бэке) — не просто end-start+1.
export const calculateVacationDays = async (startDate, endDate) => {
  try {
    const response = await timeTrackApi.get('/vacation/calculate', {
      params: { startDate, endDate },
    })

    return response.data
  } catch (error) {
    console.error('Ошибка при расчёте дней отпуска:', error)
    throw error
  }
}

// Обратная задача: по дате начала и желаемому числу дней подбирает дату
// окончания, раздвигая период на праздничные дни (см. calculate выше).
export const calculateVacationEndDate = async (startDate, days) => {
  try {
    const response = await timeTrackApi.get('/vacation/calculate-end', {
      params: { startDate, days },
    })

    return response.data
  } catch (error) {
    console.error('Ошибка при расчёте даты окончания отпуска:', error)
    throw error
  }
}

export const getVacationStats = async (year, userId) => {
  try {
    const response = await timeTrackApi.get(`/vacation/stats/${userId}/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    throw error
  }
}

export const getVacationsByYear = async (year, userId) => {
  try {
    const response = await timeTrackApi.get(`/vacation/${userId}/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    throw error
  }
}

export const getVacationById = async (id) => {
  try {
    const response = await timeTrackApi.get(`/vacation/${id}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении заявки на отпуск:', error)
    throw error
  }
}

export const getAllUserVacationsByYear = async (year) => {
  try {
    const response = await timeTrackApi.get(`/vacation/all/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении данных:', error)
    throw error
  }
}

// Урезанный (без description) список отпусков всех сотрудников — для
// виджета "отпуска коллег" (stores/vacationOther.js). Отдельное разрешение
// time:vacation_calendar:read, специально НЕ vacation.all:read — см.
// комментарий в VacationList.vue.
export const getVacationCalendarByYear = async (year) => {
  try {
    const response = await timeTrackApi.get(`/vacation/calendar/${year}`)

    return response.data
  } catch (error) {
    console.error('Ошибка при получении календаря отпусков:', error)
    throw error
  }
}

export const createVacation = async (data) => {
  try {
    const response = await timeTrackApi.post('/vacation/create', data)
    return response.data
  } catch (error) {
    console.error('Ошибка создания отпуска:', error)
    throw error
  }
}

// applicantName — ФИО сотрудника, чья заявка (фронт уже знает его из
// usersAll) — только для текста уведомления об утверждении, см.
// applicantName у createVacation.
export const updateVacationStatus = async (id, status, applicantName = '') => {
  try {
    const response = await timeTrackApi.put(`/vacation/${id}/status`, {
      status: status,
      applicantName,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка создания дня:', error)
    throw error
  }
}

export const approvedVacationStatus = async (id, applicantName = '') => {
  try {
    const response = await timeTrackApi.put(`/vacation/${id}/approve`, {
      applicantName,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка создания дня:', error)
    throw error
  }
}

export const updateVacationType = async (id, vacationTypeId) => {
  try {
    const response = await timeTrackApi.put(`/vacation/${id}/type`, {
      vacationTypeId,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка изменения типа отпуска:', error)
    throw error
  }
}

export const deleteVacation = async (id) => {
  try {
    const response = await timeTrackApi.delete(`/vacation/${id}`)
    return response.data
  } catch (error) {
    console.error('Ошибка создания дня:', error)
    throw error
  }
}
