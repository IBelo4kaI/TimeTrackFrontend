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

// user_id сотрудников, кому слать уведомления (в приложении и в VK) о новых
// заявках — отдельно для отпусков и больничных, см.
// notification.Service.GetVacationAdminRecipients/GetSickLeaveAdminRecipients
// на бэке. Значение — JSON-массив строк.
async function getNotificationRecipients(settingKey) {
  try {
    const response = await timeTrackApi.get(`/system-settings/${settingKey}`)
    const raw = response.data?.settingValue?.String
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error('Ошибка при получении получателей уведомлений:', error)
    throw error
  }
}

async function updateNotificationRecipients(settingKey, userIds) {
  try {
    await timeTrackApi.post('/system-settings/value', {
      settingKey,
      settingValue: JSON.stringify(userIds),
    })
  } catch (error) {
    console.error('Ошибка при обновлении получателей уведомлений:', error)
    throw error
  }
}

export const getVacationNotificationAdminUserIds = () =>
  getNotificationRecipients('notification_vacation_admin_user_ids')
export const updateVacationNotificationAdminUserIds = (userIds) =>
  updateNotificationRecipients('notification_vacation_admin_user_ids', userIds)

export const getSickLeaveNotificationAdminUserIds = () =>
  getNotificationRecipients('notification_sick_leave_admin_user_ids')
export const updateSickLeaveNotificationAdminUserIds = (userIds) =>
  updateNotificationRecipients('notification_sick_leave_admin_user_ids', userIds)
