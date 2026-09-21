import axios from 'axios'

// Внешний сервис "Проверка чека онлайн" — см. api_documentation.md.
// ВНИМАНИЕ: токены уходят в клиентский бандл (VITE_-переменные видны в
// devtools/сетевых запросах) — это неизбежно, раз чек проверяется прямо с
// фронта. Если это не устраивает, нужен прокси-эндпоинт на бэке, который
// держит токен на сервере.
const PROVERKACHEKA_URL = 'https://proverkacheka.com/api/v1/check/get'

// Несколько токенов через запятую (VITE_PROVERKACHEKA_TOKENS) — у лимита
// запросов лимит свой на каждый токен, при исчерпании одного переключаемся
// на следующий. VITE_PROVERKACHEKA_TOKEN (единственное число) остаётся как
// раньше для одного токена.
const TOKENS = (
  import.meta.env.VITE_PROVERKACHEKA_TOKENS ??
  import.meta.env.VITE_PROVERKACHEKA_TOKEN ??
  ''
)
  .split(',')
  .map((t) => t.trim())
  .filter(Boolean)

let nextTokenIndex = 0
function pickToken() {
  if (!TOKENS.length) {
    throw new Error('VITE_PROVERKACHEKA_TOKEN(S) не задан в .env')
  }
  const token = TOKENS[nextTokenIndex % TOKENS.length]
  nextTokenIndex++
  return token
}

// code: 0-чек некорректен, 1-успех, 2-данные пока не получены,
// 3-превышен лимит запросов, 4-подождите перед повтором, 5-прочая ошибка
const POLL_DELAY_MS = 2500
const MAX_ATTEMPTS = 6

// Сервис путает коды (например, реально существующий чек может прийти с
// 0 вместо 2/4) — различать причину по code смысла нет, показываем один
// общий текст; сам code оставляем в ошибке только для отладки в консоли.
export class ReceiptCheckError extends Error {
  constructor(code) {
    super('Не удалось получить данные чека')
    this.code = code
  }
}

// buildRequest(token) — коллбэк, собирающий и отправляющий запрос с данным
// токеном (см. вызовы ниже). triedTokens — токены, на которых уже словили
// лимит в этом опросе; при 3 (лимит) сразу пробуем следующий токен, не
// расходуя на это попытку ожидания (attempt).
async function pollCheck(buildRequest, attempt = 1, triedTokens = new Set()) {
  const token = pickToken()
  const result = await buildRequest(token)

  if (result.code === 1) return result.data.json

  if (result.code === 3) {
    triedTokens.add(token)
    if (triedTokens.size < TOKENS.length) {
      return pollCheck(buildRequest, attempt, triedTokens)
    }
  }

  if ((result.code === 2 || result.code === 4) && attempt < MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS))
    return pollCheck(buildRequest, attempt + 1, triedTokens)
  }

  throw new ReceiptCheckError(result.code)
}

// qrraw — сырая строка из QR-кода чека (t=...&s=...&fn=...&i=...&fp=...&n=...),
// как её отдаёт декодер (см. ReceiptQrScanner.vue). Сервис сам разбирает
// строку и получает чек — нам не нужно парсить её самим.
export async function checkReceiptByRaw(qrraw) {
  return pollCheck(async (token) => {
    const params = new URLSearchParams()
    params.append('token', token)
    params.append('qrraw', qrraw)

    const response = await axios.post(PROVERKACHEKA_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  })
}

// Ручной ввод (без QR) — "формат запроса 1" из api_documentation.md: набор
// реквизитов, которые печатаются внизу самого чека (ФН/ФД/ФПД/дата/сумма/
// тип операции), даже если QR-код нечитаем или его нет вовсе.
export async function checkReceiptByRequisites({ fn, fd, fp, t, s, n }) {
  return pollCheck(async (token) => {
    const params = new URLSearchParams()
    params.append('token', token)
    params.append('fn', fn)
    params.append('fd', fd)
    params.append('fp', fp)
    params.append('t', t)
    params.append('s', s)
    params.append('n', n)
    params.append('qr', '0')

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
  return pollCheck(async (token) => {
    const formData = new FormData()
    formData.append('token', token)
    formData.append('qrfile', file)

    const response = await axios.post(PROVERKACHEKA_URL, formData)
    return response.data
  })
}
