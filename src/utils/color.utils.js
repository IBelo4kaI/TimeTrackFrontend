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

function parseHex(hex) {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Invalid hex color: ${hex}`)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

function toHex(rgb) {
  return (
    '#' +
    rgb
      .map((v) =>
        Math.round(Math.min(255, Math.max(0, v)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  )
}

// -> [h: 0-360, s: 0-1, l: 0-1]
function rgbToHsl([r, g, b]) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]

  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  h *= 60
  if (h < 0) h += 360
  return [h, s, l]
}

function hslToRgb([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let rgb
  if (h < 60) rgb = [c, x, 0]
  else if (h < 120) rgb = [x, c, 0]
  else if (h < 180) rgb = [0, c, x]
  else if (h < 240) rgb = [0, x, c]
  else if (h < 300) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  return rgb.map((v) => (v + m) * 255)
}

/**
 * Подмешивает белый к цвету.
 * amount: 0 — исходный цвет, 1 — белый. Для фона обычно 0.85–0.95.
 */
export function lighten(hex, amount = 0.9) {
  const rgb = parseHex(hex)
  return toHex(rgb.map((c) => c + (255 - c) * amount))
}

/**
 * Фоновый оттенок акцентного цвета через HSL: сохраняет тон (hue),
 * фиксирует светлоту и ограничивает насыщенность, чтобы фон не «кричал».
 */
export function softBackground(hex, lightness = 0.95, maxSaturation = 0.6) {
  const [h, s] = rgbToHsl(parseHex(hex))
  return toHex(hslToRgb([h, Math.min(s, maxSaturation), lightness]))
}

/** Фоновый оттенок с учётом темы: на тёмной — тёмный и приглушённый. */
export function themedBackground(hex, isDark) {
  return isDark
    ? softBackground(hex, 0.18, 0.4)
    : softBackground(hex)
}

// Пример:
// lighten("#ff3b30", 0.9)     // светло-розовый
// softBackground("#ff3b30")   // светло-розовый фон с тем же тоном
