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
