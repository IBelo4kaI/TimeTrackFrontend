export function getContrastColor(hexColor) {
  if (!hexColor) return ''

  // Убираем # если есть
  const hex = hexColor.replace('#', '')

  // Конвертируем в RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Вычисляем относительную яркость (luminance) по формуле WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Если яркость больше 0.5, возвращаем черный, иначе белый
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}
