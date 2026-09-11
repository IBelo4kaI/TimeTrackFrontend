import axios from 'axios'

// Внешний сервис "Проверка чека онлайн" — см. api_documentation.md.
// ВНИМАНИЕ: токен уходит в клиентский бандл (VITE_-переменные видны в
// devtools/сетевых запросах) — это неизбежно, раз чек проверяется прямо с
// фронта. Если это не устраивает, нужен прокси-эндпоинт на бэке, который
// держит токен на сервере.
const PROVERKACHEKA_URL = 'https://proverkacheka.com/api/v1/check/get'
const TOKEN = import.meta.env.VITE_PROVERKACHEKA_TOKEN

// code: 0-чек некорректен, 1-успех, 2-данные пока не получены,
// 3-превышен лимит запросов, 4-подождите перед повтором, 5-прочая ошибка
const POLL_DELAY_MS = 2500
const MAX_ATTEMPTS = 6

const ERROR_MESSAGES = {
  0: 'Чек не найден — проверьте, что QR-код кассовый и не повреждён',
  2: 'Данные чека пока не получены, попробуйте ещё раз чуть позже',
  3: 'Превышено количество запросов к сервису проверки чеков',
  5: 'Сервис проверки чеков вернул ошибку',
}

export class ReceiptCheckError extends Error {
  constructor(code) {
    super(ERROR_MESSAGES[code] ?? 'Не удалось получить данные чека')
    this.code = code
  }
}

async function pollCheck(requestFn, attempt = 1) {
  const result = await requestFn()

  if (result.code === 1) return result.data.json

  if ((result.code === 2 || result.code === 4) && attempt < MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS))
    return pollCheck(requestFn, attempt + 1)
  }

  throw new ReceiptCheckError(result.code)
}

// qrraw — сырая строка из QR-кода чека (t=...&s=...&fn=...&i=...&fp=...&n=...),
// как её отдаёт декодер (см. ReceiptQrScanner.vue). Сервис сам разбирает
// строку и получает чек — нам не нужно парсить её самим.
export async function checkReceiptByRaw(qrraw) {
  return pollCheck(async () => {
    const params = new URLSearchParams()
    params.append('token', TOKEN)
    params.append('qrraw', qrraw)

    const response = await axios.post(PROVERKACHEKA_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  })
}

// Фолбэк на случай, если камера недоступна: распознавание QR по фото самим
// сервисом (сервис скачивает/декодирует картинку) — не используется по
// умолчанию, т.к. ReceiptQrScanner.vue уже декодирует QR на фото локально
// через qr-scanner и всё равно вызывает checkReceiptByRaw выше; оставлено
// на случай, если локальное распознавание не справится с конкретным фото.
export async function checkReceiptByImage(file) {
  return pollCheck(async () => {
    const formData = new FormData()
    formData.append('token', TOKEN)
    formData.append('qrfile', file)

    const response = await axios.post(PROVERKACHEKA_URL, formData)
    return response.data
  })
}
