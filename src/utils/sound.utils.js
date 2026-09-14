// Короткий звуковой сигнал успеха через Web Audio API — без внешнего
// аудиофайла (нечего грузить/хранить в бандле, звук генерируется на лету).
let audioCtx = null

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audioCtx = audioCtx || new Ctx()
  return audioCtx
}

function playTone(ctx, freq, startOffset, duration) {
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.value = freq

  // Плавные нарастание/затухание — иначе резкий щелчок вместо чистого тона.
  gain.gain.setValueAtTime(0.0001, now + startOffset)
  gain.gain.exponentialRampToValueAtTime(0.2, now + startOffset + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now + startOffset)
  osc.stop(now + startOffset + duration)
}

// Два коротких восходящих тона — сигнал "успешно" (сканирование чека и
// т.п.). Автоплей-политика браузеров может держать AudioContext
// приостановленным до жеста пользователя — сканирование само по себе уже
// требует клика/съёмки, поэтому resume() почти всегда пройдёт без проблем;
// если нет — просто тихо ничего не делаем.
export function playSuccessSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const start = () => {
      playTone(ctx, 880, 0, 0.12)
      playTone(ctx, 1320, 0.1, 0.15)
    }

    if (ctx.state === 'suspended') {
      ctx.resume().then(start).catch(() => {})
    } else {
      start()
    }
  } catch {
    // звук — не критичная функциональность, ошибку тихо игнорируем
  }
}
