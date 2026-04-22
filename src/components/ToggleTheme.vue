<template>
  <!-- Overlay заливки экрана -->
  <div ref="overlayRef" class="theme-overlay"></div>

  <button
    class="toggle-btn"
    :style="{ '--icon-size': size, '--width': width, '--height': height }"
    @click="toggle"
    :aria-label="
      themeStore.isDark() ? 'Switch to light mode' : 'Switch to dark mode'
    "
  >
    <svg
      ref="svgRef"
      class="icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- Основная форма: морфится между луной и солнцем -->
      <path
        ref="morphRef"
        class="morph-shape"
        :d="currentPath"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <!-- Glow ring -->
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { gsap } from 'gsap'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { useThemeStore } from '@/stores/themes'

gsap.registerPlugin(MorphSVGPlugin)

const themeStore = useThemeStore()

const props = defineProps<{
  size?: string
  width?: string
  height?: string
}>()

// ─── SVG paths (viewBox 0 0 24 24) ───────────────────────────────────────────

// Icon from Material Line Icons by Vjacheslav Trushkin
// https://github.com/cyberalien/line-md/blob/master/license.txt
const MOON_PATH =
  'M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z'

// Icon from Tabler Icons by Paweł Kuna
// https://github.com/tabler/tabler-icons/blob/master/LICENSE
const SUN_PATH =
  'M14.828 14.828a4 4 0 1 0-5.656-5.656a4 4 0 0 0 5.656 5.656m-8.485 2.829l-1.414 1.414M6.343 6.343L4.929 4.929m12.728 1.414l1.414-1.414m-1.414 12.728l1.414 1.414M4 12H2m10-8V2m8 10h2m-10 8v2'

// ─── Refs ─────────────────────────────────────────────────────────────────────

const svgRef = ref<SVGSVGElement | null>(null)
const morphRef = ref<SVGPathElement | null>(null)
const overlayRef = ref<HTMLDivElement | null>(null)

// computed — всегда синхронизирован со стором после перезагрузки
const currentPath = computed(() => (themeStore.isDark() ? MOON_PATH : SUN_PATH))

// ─── Animation ───────────────────────────────────────────────────────────────

let isAnimating = false

// Читает CSS-переменную напрямую с :root или .dark-theme
// Временно переключаем класс на documentElement, читаем, возвращаем обратно
function getTargetCssVar(varName: string, targetIsDark: boolean): string {
  const root = document.documentElement
  const currentlyDark = root.classList.contains('dark-theme')

  // Если целевое состояние совпадает с текущим — читаем напрямую
  if (targetIsDark === currentlyDark) {
    return getComputedStyle(root).getPropertyValue(varName).trim()
  }

  // Иначе — временно переключаем класс, читаем, возвращаем
  if (targetIsDark) root.classList.add('dark-theme')
  else root.classList.remove('dark-theme')

  const value = getComputedStyle(root).getPropertyValue(varName).trim()

  if (targetIsDark) root.classList.remove('dark-theme')
  else root.classList.add('dark-theme')

  return value
}

function toggle(e: MouseEvent) {
  if (isAnimating) return
  isAnimating = true

  const toLight = themeStore.isDark() // dark → light

  const x = e.clientX
  const y = e.clientY
  const maxR = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // Читаем --background целевой темы ДО любых изменений
  const targetBg = getTargetCssVar('--background', !toLight)

  const el = overlayRef.value!
  const next = toLight ? themeStore.THEMES.LIGHT : themeStore.THEMES.DARK

  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating = false
    },
  })

  // 1. Иконка: сжатие + вращение
  tl.to(svgRef.value, {
    scale: 0.8,
    rotation: toLight ? 180 : -180,
    duration: 0.2,
    ease: 'power2.in',
    transformOrigin: '50% 50%',
  })

  // 2. Морфинг формы
  tl.to(
    morphRef.value,
    {
      morphSVG: toLight ? SUN_PATH : MOON_PATH,
      duration: 0.4,
      ease: 'power3.inOut',
    },
    '<0.05'
  )

  // 3. Возврат масштаба + завершение вращения
  tl.to(
    svgRef.value,
    {
      scale: 1,
      rotation: toLight ? 360 : -360,
      duration: 0.38,
      ease: 'back.out(1.8)',
      transformOrigin: '50% 50%',
    },
    '<0.15'
  )

  // 4. Overlay раскрывается от точки клика (тема ещё не применена)
  tl.call(() => {
    gsap.set(el, {
      clipPath: `circle(0px at ${x}px ${y}px)`,
      backgroundColor: targetBg,
      display: 'block',
    })
  })

  tl.to(el, {
    clipPath: `circle(${maxR}px at ${x}px ${y}px)`,
    duration: 0.3,
    ease: 'power2.inOut',
  })

  // 5. В середине заливки — применяем тему (страница меняется под overlay)
  tl.call(
    () => {
      themeStore.setTheme(next)
    },
    [],
    '<0.3 '
  ) // на 50% длительности предыдущего tween

  // 6. Overlay схлопывается, открывая уже новую тему
  tl.to(el, {
    clipPath: `circle(0px at ${x}px ${y}px)`,
    duration: 0.4,
    ease: 'power2.inOut',
    onComplete: () => {
      gsap.set(el, { display: 'none' })
    },
  })
}

// ─── Init ─────────────────────────────────────────────────────────────────────

onMounted(() => {
  const dark = themeStore.isDark()

  gsap.set(svgRef.value, { scale: 1, rotation: 0, transformOrigin: '50% 50%' })
  gsap.set(overlayRef.value, { display: 'none' })
})
</script>

<style scoped>
/* Overlay для заливки экрана */
.theme-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  display: none;
  will-change: clip-path;
}

.toggle-btn {
  --icon-size: 1rem;
  --width: calc(var(--padding-secondary) * 2 + var(--icon-size));
  --height: calc(var(--padding-secondary) * 2 + var(--icon-size));

  position: relative;
  width: var(--width);
  height: var(--height);
  aspect-ratio: 1 / 1;
  border-radius: var(--border-radius);
  border: 0.1rem solid var(--border-color);
  background: var(--foreground);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--padding-secondary) / 2);
  overflow: visible;
  outline: none;
  transition:
    background 0.3s,
    border-color 0.2s;
}

.toggle-btn:hover {
  background: var(--background);
}

.icon-svg {
  width: var(--icon-size);
  height: var(--icon-size);
  color: var(--accent);
  display: block;
  will-change: transform;
}

.morph-shape {
  transition: none;
}
</style>
