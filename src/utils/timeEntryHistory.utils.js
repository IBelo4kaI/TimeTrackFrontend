export const historyDayKey = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}
export const historyId = (value) => typeof value === 'string' ? value : value?.Valid ? value.String : null
