// useDocumentHeader.js
//
// npm install lvovich
//
// Корректное использование API lvovich:
//   incline(person, declension) — склоняет объект {first, last, middle}
//   getGender({first, last, middle}) — определяет пол
//
// Падежи (DeclentionStrT):
//   'nominative'   — именительный  (кто?)
//   'genitive'     — родительный   (кого?)
//   'dative'       — дательный     (кому?)
//   'accusative'   — винительный   (кого/что?)
//   'instrumental' — творительный  (кем?)
//   'prepositional'— предложный    (о ком?)

import { incline, getGender } from 'lvovich'

// ─── Склонение ФИО ──────────────────────────────────────────────────────────

/**
 * Разбивает строку ФИО на объект для lvovich.
 * "Степановский Виктор Викторович" → { last, first, middle }
 * "Мишукова Кристина"              → { last, first }
 */
function parseName(fullName) {
  const [last = '', first = '', middle] = fullName.trim().split(/\s+/)
  return { last, first, ...(middle ? { middle } : {}) }
}

/**
 * Склоняет ФИО в нужный падеж и возвращает "Фамилия И.О."
 *
 * @param {string} fullName   — "Мишукова Кристина" или "Степановский Виктор Викторович"
 * @param {string} declension — 'nominative' | 'genitive' | 'dative' | ...
 * @returns {string}          — "Мишуковой К." / "Степановскому В.В."
 */
function formatNameShort(fullName, declension) {
  const person = parseName(fullName)

  // Определяем пол через getGender — он принимает тот же объект {first, last, middle}
  const gender = getGender(person)

  // incline возвращает объект { last, first, middle } в нужном падеже
  const inflected = incline({ ...person, gender }, declension)

  // Собираем инициалы из inflected (НЕ из оригинала — падеж нужен везде)
  const initials = [inflected.first, inflected.middle]
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + '.')
    .join('')

  return `${inflected.last} ${initials}`.trim()
}

// ─── Склонение должностей ───────────────────────────────────────────────────
// lvovich работает только с именами, поэтому должности
// склоняем по правилам русских окончаний.

function inflectPosition(position, declension) {
  if (declension !== 'genitive' && declension !== 'dative') return position

  // Составные через дефис: "техник-проектировщик" → склоняем каждую часть
  if (position.includes('-')) {
    return position
      .split('-')
      .map((w) => inflectWord(w, declension))
      .join('-')
  }

  // Составные через пробел: "генеральный директор" → склоняем каждое слово
  return position
    .split(' ')
    .map((w) => inflectWord(w, declension))
    .join(' ')
}

function inflectWord(word, declension) {
  const w = word.toLowerCase()

  // Служебные слова не склоняем
  if (['по', 'и', 'или', 'на', 'за', 'а', 'с'].includes(w)) return word

  return declension === 'dative' ? applyDative(word, w) : applyGenitive(word, w)
}

function applyDative(word, w) {
  // Прилагательные (генеральный → генеральному)
  if (w.endsWith('ный')) return word.replace(/ный$/i, 'ному')
  if (w.endsWith('ьный')) return word.replace(/ный$/i, 'ному')
  if (w.endsWith('дший')) return word.replace(/дший$/i, 'дшему')
  if (w.endsWith('щий')) return word.replace(/щий$/i, 'щему')

  // Существительные мужского рода
  if (w.endsWith('тель')) return word.replace(/тель$/i, 'телю')
  if (w.endsWith('ник')) return word + 'у'
  if (w.endsWith('щик')) return word + 'у'
  if (w.endsWith('чик')) return word + 'у'
  if (w.endsWith('ист')) return word + 'у'
  if (w.endsWith('ант')) return word + 'у'
  if (w.endsWith('ент')) return word + 'у'
  if (w.endsWith('нт')) return word + 'у'
  if (w.endsWith('ар')) return word + 'у'
  if (w.endsWith('ор')) return word + 'у'
  if (w.endsWith('ер')) return word + 'у'
  if (w.endsWith('жер')) return word + 'у'
  if (w.endsWith('лог')) return word + 'у'
  if (w.endsWith('граф')) return word + 'у'
  if (w.endsWith('нг')) return word + 'у'
  if (w.endsWith('ф')) return word + 'у'

  // Существительные женского рода
  if (w.endsWith('ница')) return word.replace(/а$/i, 'е')
  if (w.endsWith('ша')) return word.replace(/а$/i, 'е')
  if (w.endsWith('ка')) return word.replace(/а$/i, 'е')

  // Общее: слово на согласную → +у
  const last = w[w.length - 1]
  if (!'аеёиоуыьъэюя'.includes(last)) return word + 'у'

  return word
}

function applyGenitive(word, w) {
  // Прилагательные (генеральный → генерального)
  if (w.endsWith('ный')) return word.replace(/ный$/i, 'ного')
  if (w.endsWith('ьный')) return word.replace(/ный$/i, 'ного')
  if (w.endsWith('дший')) return word.replace(/дший$/i, 'дшего')
  if (w.endsWith('щий')) return word.replace(/щий$/i, 'щего')

  // Существительные мужского рода
  if (w.endsWith('тель')) return word.replace(/тель$/i, 'теля')
  if (w.endsWith('ник')) return word + 'а'
  if (w.endsWith('щик')) return word + 'а'
  if (w.endsWith('чик')) return word + 'а'
  if (w.endsWith('ист')) return word + 'а'
  if (w.endsWith('ант')) return word + 'а'
  if (w.endsWith('ент')) return word + 'а'
  if (w.endsWith('нт')) return word + 'а'
  if (w.endsWith('ар')) return word + 'а'
  if (w.endsWith('ор')) return word + 'а'
  if (w.endsWith('ер')) return word + 'а'
  if (w.endsWith('жер')) return word + 'а'
  if (w.endsWith('лог')) return word + 'а'
  if (w.endsWith('граф')) return word + 'а'
  if (w.endsWith('нг')) return word + 'а'
  if (w.endsWith('ф')) return word + 'а'

  // Существительные женского рода
  if (w.endsWith('ница')) return word.replace(/а$/i, 'ы')
  if (w.endsWith('ша')) return word.replace(/а$/i, 'и')
  if (w.endsWith('ка')) return word.replace(/а$/i, 'и')

  // Общее: слово на согласную → +а
  const last = w[w.length - 1]
  if (!'аеёиоуыьъэюя'.includes(last)) return word + 'а'

  return word
}

// ─── Утилиты ────────────────────────────────────────────────────────────────

function formatCompany(company) {
  return company.replace(/\\?"([^"\\]+)\\?"/g, '«$1»')
}

function todayFormatted() {
  const now = new Date()
  return [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('.')
}

// ─── Основная функция ───────────────────────────────────────────────────────

/**
 * @param {Object} user
 * @param {string} user.full_name           "Мишукова Кристина"
 * @param {string} user.company             'ООО "Строй технологии"'
 * @param {string} user.position            "Техник-проектировщик"
 * @param {string} user.director            "Степановский Виктор Викторович"
 * @param {string} user.director_position   "Директор"
 */
export function buildDocumentHeader(user) {
  return {
    // "Директор" → "Директору"
    directorPositionDat: inflectPosition(user.director_position, 'dative'),

    // ООО "..." → ООО «...»
    company: formatCompany(user.company),

    // "Степановский Виктор Викторович" → "Степановскому В.В."
    directorShort: formatNameShort(user.director, 'dative'),

    // "Техник-проектировщик" → "техника-проектировщика"
    fromPositionGen: inflectPosition(user.position, 'genitive').toLowerCase(),

    // "Мишукова Кристина" → "Мишуковой К."
    fromNameGen: formatNameShort(user.full_name, 'genitive'),

    // "Мишукова Кристина" → "Мишукова К."  (именительный, для подписи)
    fromName: formatNameShort(user.full_name, 'nominative'),

    // "26.02.2026"
    currentDate: todayFormatted(),
  }
}
