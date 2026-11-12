<template>
  <div class="santa-scene">
    <span class="santa-spark santa-spark--one" aria-hidden="true">✧</span>
    <span class="santa-spark santa-spark--two" aria-hidden="true">✧</span>
    <button
      ref="santaButton"
      class="santa-button"
      :class="{ 'is-throwing': playing }"
      type="button"
      :disabled="playing"
      aria-label="Дед Мороз: бросить снежок в экран"
      @click="throwSnowball"
    >
      <svg class="santa" viewBox="0 0 280 340" fill="none" aria-hidden="true">
        <ellipse
          cx="143"
          cy="318"
          rx="90"
          ry="10"
          fill="currentColor"
          opacity=".07"
        />
        <g class="santa-body">
          <path
            d="M88 297L84 318Q102 327 127 318L128 295M154 296L156 318Q183 326 198 316L190 295"
            fill="#253c59"
          />
          <path
            d="M100 155Q70 190 65 290Q140 322 211 290Q202 196 174 155Z"
            fill="#c92d46"
          />
          <path
            d="M101 167Q83 218 81 284M185 188Q198 231 199 282"
            stroke="#e94b5e"
            stroke-width="8"
            stroke-linecap="round"
          />
          <path d="M138 201V295" stroke="#fff7e9" stroke-width="19" />
          <path
            d="M70 289Q139 312 206 289"
            stroke="#fff7e9"
            stroke-width="21"
            stroke-linecap="round"
          />
          <path
            d="M77 250Q140 267 200 250"
            stroke="#6f273c"
            stroke-width="14"
          />
          <rect x="125" y="249" width="29" height="22" rx="4" fill="#f2c765" />
          <rect x="132" y="255" width="15" height="10" rx="1" fill="#6f273c" />
          <path
            d="M91 164Q56 173 49 217"
            stroke="#c92d46"
            stroke-width="29"
            stroke-linecap="round"
          />
          <path
            d="M40 219L35 238C31 254 52 261 59 246L62 239L64 243C69 249 76 243 72 237L62 224Z"
            fill="#36668b"
          />
          <path
            d="M39 216L61 222"
            stroke="#fff7e9"
            stroke-width="16"
            stroke-linecap="round"
          />
          <g class="santa-arm">
            <path
              d="M179 169Q207 185 222 154"
              stroke="#c92d46"
              stroke-width="29"
              stroke-linecap="round"
            />
            <path
              d="M215 157L207 145C201 136 209 131 215 137L220 142L223 130C227 116 248 122 245 137L239 163Z"
              fill="#36668b"
            />
            <path
              d="M215 155L237 162"
              stroke="#fff7e9"
              stroke-width="16"
              stroke-linecap="round"
            />
            <g class="held-snowball">
              <circle ref="heldSnowball" cx="235" cy="111" r="19" fill="#fff" />
              <path
                d="M224 113Q234 123 247 112"
                stroke="#dcecf6"
                stroke-width="3"
                stroke-linecap="round"
              />
            </g>
          </g>
          <path
            d="M91 115Q75 169 104 196L139 222L174 198Q203 166 185 115Z"
            fill="#fff7e9"
          />
          <path
            d="M101 146Q99 179 120 191M178 151Q178 177 158 191"
            stroke="#e8e5df"
            stroke-width="4"
            stroke-linecap="round"
          />
          <ellipse cx="140" cy="112" rx="43" ry="40" fill="#f4c8ab" />
          <ellipse
            cx="108"
            cy="126"
            rx="10"
            ry="6"
            fill="#ec9b93"
            opacity=".7"
          />
          <ellipse
            cx="172"
            cy="126"
            rx="10"
            ry="6"
            fill="#ec9b93"
            opacity=".7"
          />
          <path
            d="M112 108L124 106M155 106L167 108"
            stroke="#fff7e9"
            stroke-width="6"
            stroke-linecap="round"
          />
          <path
            d="M116 117Q120 112 124 117M155 117Q159 112 163 117"
            stroke="#3c4052"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            d="M128 146Q140 157 152 146"
            stroke="#a94953"
            stroke-width="4"
            stroke-linecap="round"
          />
          <path
            d="M140 132Q119 121 108 144Q126 150 140 137Q154 150 173 144Q161 121 140 132"
            fill="#fffdf4"
          />
          <ellipse cx="140" cy="128" rx="10" ry="8" fill="#e9ab96" />
          <path
            d="M93 92Q94 32 143 30Q181 27 194 66L211 79L188 91Q165 63 152 63L178 95Z"
            fill="#c92d46"
          />
          <path
            d="M107 67Q113 43 138 42"
            stroke="#e94b5e"
            stroke-width="7"
            stroke-linecap="round"
          />
          <path
            d="M94 94Q139 78 183 95"
            stroke="#fff7e9"
            stroke-width="23"
            stroke-linecap="round"
          />
          <circle cx="211" cy="82" r="16" fill="#fff7e9" />
          <g stroke="#f5dbaa" stroke-width="2" stroke-linecap="round">
            <path
              d="M101 224V240M93 232H109M96 227L106 237M96 237L106 227M177 274V288M170 281H184M172 276L182 286M172 286L182 276"
            />
          </g>
        </g>
      </svg>
    </button>
    <Teleport to="body">
      <div
        v-if="playing"
        class="snow-overlay"
        :style="launchStyle"
        aria-hidden="true"
      >
        <div class="flying-snowball" />
        <canvas ref="snowCanvas" class="snow-on-glass" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'

const heldSnowball = ref(null)
const snowCanvas = ref(null)
const playing = ref(false)
const launchStyle = ref({})
let animationFrame = 0
let generation = 0

function createSnowTexture() {
  const texture = document.createElement('canvas')
  texture.width = texture.height = 256
  const ctx = texture.getContext('2d')
  const points = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2
    const radius = 99 + Math.sin(i * 2.7) * 12 + Math.cos(i * 1.3) * 8
    return {
      x: 128 + Math.cos(angle) * radius,
      y: 128 + Math.sin(angle) * radius,
    }
  })
  const last = points.at(-1)
  ctx.beginPath()
  ctx.moveTo((last.x + points[0].x) / 2, (last.y + points[0].y) / 2)
  points.forEach((point, i) => {
    const next = points[(i + 1) % points.length]
    ctx.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + next.x) / 2,
      (point.y + next.y) / 2
    )
  })
  ctx.closePath()
  const shade = ctx.createRadialGradient(105, 88, 10, 128, 128, 120)
  shade.addColorStop(0, '#ffffff')
  shade.addColorStop(0.75, '#f6fbff')
  shade.addColorStop(1, '#dceaf3')
  ctx.fillStyle = shade
  ctx.shadowColor = '#7597ad30'
  ctx.shadowBlur = 3
  ctx.shadowOffsetY = 2
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.save()
  ctx.clip()
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = i % 3 ? '#ffffff90' : '#a6c4d32a'
    ctx.beginPath()
    ctx.arc(
      (i * 73.13) % 256,
      (i * 43.71) % 256,
      0.5 + (i % 3) * 0.35,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
  ctx.restore()
  return texture
}

async function throwSnowball() {
  if (playing.value) return
  const currentGeneration = ++generation
  const bounds = heldSnowball.value.getBoundingClientRect()
  launchStyle.value = {
    '--launch-x': `${bounds.left + bounds.width / 2}px`,
    '--launch-y': `${bounds.top + bounds.height / 2}px`,
  }
  playing.value = true
  await nextTick()
  if (currentGeneration !== generation) return
  const canvas = snowCanvas.value
  const ctx = canvas.getContext('2d')
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  const texture = createSnowTexture()
  const patches = Array.from({ length: 88 }, (_, i) => ({
    x: ((i % 11) - 0.15 + Math.sin(i * 13) * 0.22) / 10,
    y: (Math.floor(i / 11) - 0.15 + Math.cos(i * 7) * 0.2) / 7,
    radius: 1.22 + (Math.sin(i * 19) + 1) * 0.2,
    delay: 0.35 + (Math.sin(i * 9.7) + 1) * 0.6,
    speed: 0.65 + (Math.cos(i * 4.1) + 1) * 0.4,
    tilt: Math.sin(i * 3.7) * 0.4,
  }))
  let width = 0
  let height = 0
  let released = false
  const startedAt = performance.now()

  function draw(now) {
    const elapsed = (now - startedAt) / 1000
    const hit = elapsed - 0.9
    if (width !== window.innerWidth || height !== window.innerHeight) {
      width = window.innerWidth
      height = window.innerHeight
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    ctx.clearRect(0, 0, width, height)
    if (!released && elapsed >= 0.35) {
      const release = heldSnowball.value.getBoundingClientRect()
      launchStyle.value = {
        '--launch-x': `${release.left + release.width / 2}px`,
        '--launch-y': `${release.top + release.height / 2}px`,
      }
      released = true
    }
    if (hit >= 0) {
      ctx.save()
      if (reducedMotion) {
        ctx.globalAlpha = Math.max(0, 1 - hit / 1.2) * 0.85
      } else {
        // Удар расходится от центра, затем каждое пятно сползает отдельно.
        const spread = Math.min(1, hit / 0.26)
        ctx.beginPath()
        ctx.ellipse(
          width * 0.5,
          height * 0.45,
          Math.max(1, width * 0.85 * spread),
          Math.max(1, height * 0.9 * spread),
          0,
          0,
          Math.PI * 2
        )
        ctx.clip()
      }
      patches.forEach((patch) => {
        const age = reducedMotion ? 0 : Math.max(0, hit - patch.delay)
        const slide = Math.pow(age, 2.3) * height * 0.17 * patch.speed
        const stretch = 1 + Math.min(0.8, age * 0.25)
        const w = (width / 10) * patch.radius * 2
        const h = (height / 7) * patch.radius * 2
        const x = patch.x * width
        const y = patch.y * height + slide
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(patch.tilt * Math.min(1, age))
        ctx.globalAlpha *= Math.max(0, 1 - Math.max(0, age - 2) * 0.35)
        ctx.drawImage(texture, -w / 2, -h / 2, w, h * stretch)
        if (age > 0.3) {
          ctx.fillStyle = '#f3faff'
          ctx.beginPath()
          ctx.ellipse(
            w * 0.12,
            h * stretch * 0.48 + age * 12,
            Math.max(2, w * 0.026),
            Math.max(4, h * 0.065),
            0,
            0,
            Math.PI * 2
          )
          ctx.fill()
        }
        ctx.restore()
      })
      ctx.restore()
    }
    if (elapsed < (reducedMotion ? 2.2 : 6.4)) {
      animationFrame = requestAnimationFrame(draw)
    } else {
      playing.value = false
      animationFrame = 0
    }
  }
  animationFrame = requestAnimationFrame(draw)
}

onBeforeUnmount(() => {
  generation++
  cancelAnimationFrame(animationFrame)
})
</script>

<style scoped>
.santa-scene {
  position: relative;
  display: grid;
  place-items: center;
  flex: 1;
  min-height: 21rem;
  isolation: isolate;
  background: radial-gradient(ellipse at 50% 55%, #b9dcf328, transparent 65%);
}
.santa-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 18rem;
  padding: 1rem;
  border: 0;
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.santa-button:disabled {
  cursor: default;
}
.santa-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
.santa {
  width: 100%;
  overflow: visible;
}
.santa-body {
  transform-origin: 140px 310px;
  animation: santa-breathe 3.5s ease-in-out infinite;
}
.santa-arm {
  transform-origin: 180px 170px;
  animation: santa-wave 3.5s ease-in-out infinite;
}
.santa-caption {
  margin-top: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
}
.santa-hint {
  margin-top: 0.35rem;
  font-size: 0.78rem;
  color: var(--muted-text);
}
.santa-spark {
  position: absolute;
  color: var(--accent);
  opacity: 0.4;
  font-size: 2rem;
  animation: santa-sparkle 3s ease-in-out infinite;
  pointer-events: none;
}
.santa-spark--one {
  left: 12%;
  top: 25%;
}
.santa-spark--two {
  right: 12%;
  top: 12%;
  animation-delay: -1.5s;
  font-size: 1.4rem;
}
.is-throwing .santa-body {
  animation: santa-toss 0.7s ease-in-out both;
}
.is-throwing .santa-arm {
  animation: santa-throw 0.7s ease-in-out both;
}
.is-throwing .held-snowball {
  animation: release-snowball 0.7s step-end both;
}
.snow-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  overflow: hidden;
}
.flying-snowball {
  position: absolute;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    #fff 25%,
    #e2f0fa 75%,
    #bbd5e9
  );
  box-shadow: 0 0 1rem #ffffff80;
  animation: snowball-flight 0.65s 0.35s cubic-bezier(0.35, 0, 0.8, 0.5) both;
}
.snow-on-glass {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
@keyframes santa-breathe {
  0%,
  100% {
    transform: rotate(-1deg);
  }
  50% {
    transform: translateY(-3px) rotate(1deg);
  }
}
@keyframes santa-wave {
  0%,
  60%,
  100% {
    transform: rotate(0);
  }
  72%,
  90% {
    transform: rotate(-12deg);
  }
  81% {
    transform: rotate(6deg);
  }
}
@keyframes santa-sparkle {
  0%,
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.65;
    transform: scale(1.1);
  }
}
@keyframes santa-toss {
  35% {
    transform: rotate(6deg);
  }
  65% {
    transform: rotate(-5deg);
  }
  100% {
    transform: rotate(0);
  }
}
@keyframes santa-throw {
  35% {
    transform: rotate(-65deg);
  }
  65% {
    transform: rotate(40deg);
  }
  100% {
    transform: rotate(0);
  }
}
@keyframes release-snowball {
  0% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}
@keyframes snowball-flight {
  0% {
    left: var(--launch-x);
    top: var(--launch-y);
    transform: translate(-50%, -50%) scale(0.6);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    left: 50%;
    top: 45%;
    transform: translate(-50%, -50%) scale(18);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .santa-body,
  .santa-arm,
  .santa-spark,
  .is-throwing .santa-body,
  .is-throwing .santa-arm {
    animation: none;
  }
  .flying-snowball {
    display: none;
  }
}
</style>
