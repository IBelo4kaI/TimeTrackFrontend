import { timeTrackApi } from './api'

export const getSettingVacationDuration = async () => {
  try {
    const response = await timeTrackApi.get(
      `/system-settings/vacation_duration`
    )

    return response.data.settingValue.String
  } catch (error) {
    console.error('Error fetching calendar days:', error)
    throw error
  }
}

export const updateSettingVacationDuration = async (value) => {
  try {
    const response = await timeTrackApi.post('/system-settings/value', {
      settingKey: 'vacation_duration',
      settingValue: String(value),
    })

    return response.data.settingValue
  } catch (error) {
    console.error('Ошибка обновления дня:', error)
    throw error
  }
}
