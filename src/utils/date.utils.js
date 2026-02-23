export const parseDate = (dateString) => {
  return new Date(dateString)
}

export const parseDateStartDay = (dateString) => {
  const date = new Date(dateString)
  date.setUTCHours(0, 0, 0, 0)
  console.log(date)
  return date
}
