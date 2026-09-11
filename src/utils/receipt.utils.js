// Нулевые/необязательные колонки бэк отдаёт как sql.NullString/NullInt64/
// NullInt32 — {String|Int64|Int32, Valid}, а не голым значением (как
// vacationTypeId.Valid/.String у vacation, createdAt.Time/.Valid и т.п.).
// ticketDate/createdAt/updatedAt у чека — DATETIME NOT NULL, поэтому они
// приходят обычной ISO-строкой, разворачивать не нужно.
export const nullString = (v) => (v?.Valid ? v.String : null)
export const nullInt = (v) => (v?.Valid ? (v.Int64 ?? v.Int32) : null)

// Суммы в чеке — в копейках (BIGINT на бэке), сюда приходит уже число.
export const formatMoney = (kopecks) => {
  if (kopecks == null) return '—'
  return (
    (kopecks / 100).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ₽'
  )
}

export const OPERATION_TYPE_LABELS = {
  1: 'Приход',
  2: 'Возврат прихода',
  3: 'Расход',
  4: 'Возврат расхода',
}

export const TAXATION_TYPE_LABELS = {
  1: 'ОСН',
  2: 'УСН (доходы)',
  4: 'УСН (доходы-расходы)',
  8: 'ЕНВД',
  16: 'ЕСХН',
  32: 'ПСН',
}

export const getOperationTypeLabel = (type) =>
  OPERATION_TYPE_LABELS[type] ?? `Тип ${type}`

export const getTaxationTypeLabel = (type) =>
  type == null ? null : (TAXATION_TYPE_LABELS[type] ?? `Тип ${type}`)
