// Бэк отдаёт nullable-колонки как sql.NullString/sql.NullTime/sql.NullInt64
// сериализованные в {String/Time/Int64, Valid} — не как обычный null/значение
// (та же особенность sqlc, что уже встречалась для vacation/дат в этом проекте).
export const unwrapNull = (v, key) => (v?.Valid ? v[key] : null)
export const unwrapNullString = (v) => unwrapNull(v, 'String')
export const unwrapNullTime = (v) => unwrapNull(v, 'Time')
export const unwrapNullInt = (v) => unwrapNull(v, 'Int64')

// Отображаемое имя чата. Для группового — его название (если задано), для
// личного — ФИО собеседника (найденного по already-загруженным участникам).
export function getChatDisplayName(chat, participants, currentUserId, usersAll) {
  if (chat?.type === 'group') {
    const name = unwrapNullString(chat.name)
    return name || 'Групповой чат'
  }

  const other = (participants ?? []).find((p) => p.userId !== currentUserId)
  if (!other) return 'Личный чат'

  const user = usersAll.find((u) => u.id === other.userId)
  if (!user) return 'Личный чат'

  return [user.surname, user.name].filter(Boolean).join(' ')
}

export function getUserInitials(user) {
  if (!user) return '?'
  return [user.surname?.[0], user.name?.[0]].filter(Boolean).join('').toUpperCase()
}

export function formatMessageTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Разделитель дат между сообщениями — "Сегодня"/"Вчера"/полная дата.
export function formatMessageDateLabel(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (isSameDay(date, today)) return 'Сегодня'
  if (isSameDay(date, yesterday)) return 'Вчера'

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  })
}

export function isSameMessageDay(isoA, isoB) {
  if (!isoA || !isoB) return false
  return isSameDay(new Date(isoA), new Date(isoB))
}

// Вложения сообщений отдаются самим бэком (GET /files/open/:id) — тот же
// эндпоинт, что уже используется для файлов отпусков/больничных, поэтому
// отдельного blob-фетча для превью/скачивания не нужно: /apitime — тот же
// origin, что и сама страница, куки идут с запросом автоматически.
export function fileOpenUrl(fileId) {
  return `/apitime/files/open/${fileId}`
}

export function formatFileSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

// Ссылка на сущность в сообщении (см. миграцию 012_add_chat_message_entity_ref.sql
// в бэке) — на данный момент кликабельно поддержаны только заявки на отпуск
// (у них есть отдельная страница-карточка); остальные типы сущностей (когда
// появятся) просто покажутся некликабельной карточкой с заголовком/подписью.
const ENTITY_REF_ROUTES = {
  vacation: (id) => ({ name: 'vacation-application', params: { id } }),
}

export function entityRefRoute(entityType, entityId) {
  return ENTITY_REF_ROUTES[entityType]?.(entityId) ?? null
}

export function entityRefIconClass(entityType) {
  switch (entityType) {
    case 'vacation':
      return 'fa-regular fa-plane-departure'
    case 'sick_leave':
      return 'fa-regular fa-briefcase-medical'
    default:
      return 'fa-regular fa-link'
  }
}

// Клиентский аналог detectFileType на бэке (internal/service/file.go) — нужен
// только для иконки чипа ДО отправки, пока у файла есть только браузерный
// File.type (mime), а не серверный fileType.
export function detectFileTypeFromMime(mimeType) {
  if (!mimeType) return 'other'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'document'
  return 'other'
}

export function fileIconClass(fileType) {
  switch (fileType) {
    case 'image':
      return 'fa-regular fa-image'
    case 'video':
      return 'fa-regular fa-file-video'
    case 'document':
      return 'fa-regular fa-file-pdf'
    default:
      return 'fa-regular fa-file'
  }
}
