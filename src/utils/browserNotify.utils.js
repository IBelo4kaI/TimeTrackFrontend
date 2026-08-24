// Браузерные уведомления (Notification API) + звук — общее для чатов и
// персистентных уведомлений (колокольчик), вынесено из stores/chat.js,
// чтобы не дублировать в stores/notificationCenter.js.

// Спрашиваем только если ответа ещё не было — повторный запрос при
// "denied" браузеры и так молча игнорируют, а при "granted" он не нужен.
export function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') Notification.requestPermission()
}

// Нативное уведомление — только пока вкладка не в фокусе, иначе дублирует
// уже видимый тост. tag группирует уведомления (новое заменяет предыдущее
// непрочитанное с тем же tag, а не копится поверх).
export function notifyBrowser(title, body, tag, onClick) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') {
    console.warn('[notify] уведомление браузера не показано, permission =', Notification.permission)
    return
  }
  if (!document.hidden && document.hasFocus()) return

  const notification = new Notification(title, { body, icon: '/favicon.ico', tag })
  notification.onclick = () => {
    window.focus()
    onClick?.()
    notification.close()
  }
}

// Короткий "дзынь" через Web Audio — без mp3-файла, чтобы не таскать
// отдельный ассет. Один AudioContext на вкладку, создаём лениво.
let audioCtx = null

// Автоплей-политика браузера не даёт стартовать AudioContext без жеста
// пользователя — resume() из playNotificationSound() к моменту реального
// уведомления это уже не спасает. Прогреваем на первый же клик/клавишу/тап
// по странице, задолго до того, как звук реально понадобится.
export function primeAudioContext() {
  const unlock = () => {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  }
  document.addEventListener('click', unlock, { once: true })
  document.addEventListener('keydown', unlock, { once: true })
  document.addEventListener('touchstart', unlock, { once: true })
}

function playTone(ctx, freq, startAt, duration) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startAt)
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  osc.start(startAt)
  osc.stop(startAt + duration)
}

export async function playNotificationSound() {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()

    // Без клика/тапа по странице контекст создаётся в состоянии
    // "suspended" (автоплей-политика браузера) — без явного resume()
    // звука просто не будет, без единой ошибки в консоли.
    if (audioCtx.state === 'suspended') await audioCtx.resume()

    const now = audioCtx.currentTime
    // Два восходящих тона ("динь-дон") вместо одного плоского бипа.
    playTone(audioCtx, 659.25, now, 0.13) // E5
    playTone(audioCtx, 987.77, now + 0.11, 0.22) // B5
  } catch (err) {
    console.warn('[notify] звук уведомления не сыграл:', err)
  }
}
