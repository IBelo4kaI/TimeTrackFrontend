import { timeTrackApi } from './api'

// Настройки почты для писем (см. internal/smtp_settings на бэке) — пароль
// в GET никогда не возвращается, только passwordSet: bool.
export const getSmtpSettings = async () => {
  try {
    const response = await timeTrackApi.get('/smtp-settings')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении настроек SMTP:', error)
    throw error
  }
}

// password — undefined/не передан = не менять сохранённый пароль.
export const updateSmtpSettings = async ({
  host,
  port,
  username,
  from,
  password,
}) => {
  try {
    const response = await timeTrackApi.post('/smtp-settings', {
      host,
      port,
      username,
      from,
      password,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при обновлении настроек SMTP:', error)
    throw error
  }
}
