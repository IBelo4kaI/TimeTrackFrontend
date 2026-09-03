<template>
  <div class="toggle-theme">
    <div class="toggle-theme__indicator" :style="indicatorStyle"></div>
    <button
      v-for="option in themeOptions"
      :key="option.value"
      ref="btnRefs"
      type="button"
      class="toggle-theme__btn"
      :class="{ active: themeStore.currentTheme === option.value }"
      :aria-label="option.value"
      @click="themeStore.setTheme(option.value)"
    >
      <svg
        width="1.875rem"
        height="1.875rem"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        :class="{ 'icon-active': themeStore.currentTheme === option.value }"
      >
        <!-- LIGHT: sun -->
        <template v-if="option.value === themeStore.THEMES.LIGHT">
          <circle class="sun" cx="20" cy="20" r="7" stroke-width="2" />
          <path
            class="sun"
            d="M20 8V5"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="sun"
            d="M20 35V32"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="sun"
            d="M8 20H5"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="sun"
            d="M35 20H32"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="sun"
            d="M11.5 11.5L9.3 9.3"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="sun"
            d="M30.7 30.7L28.5 28.5"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="sun"
            d="M11.5 28.5L9.3 30.7"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="sun"
            d="M30.7 9.3L28.5 11.5"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>

        <!-- DARK: moon -->
        <path
          v-else-if="option.value === themeStore.THEMES.DARK"
          class="moon"
          d="M35 21.32A15 15 0 1 1 18.68 5 11.67 11.67 0 0 0 35 21.32Z"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- SYSTEM: monitor -->
        <template v-else>
          <rect
            class="monitor"
            x="7"
            y="9"
            width="26"
            height="17"
            rx="2"
            stroke-width="2"
          />
          <path
            class="monitor"
            d="M20 26V31"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            class="monitor"
            d="M14 31H26"
            stroke-width="2"
            stroke-linecap="round"
          />
        </template>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { useThemeStore } from '@/stores/themes'
import { nextTick, onMounted, ref, watch } from 'vue'

const themeStore = useThemeStore()

const themeOptions = [
  { value: themeStore.THEMES.LIGHT },
  { value: themeStore.THEMES.DARK },
  { value: themeStore.THEMES.SYSTEM },
]

// Скользящий фон под активной кнопкой — измеряем реальную позицию/ширину
// кнопки (а не считаем по индексу), чтобы не зависеть от gap/padding.
const btnRefs = ref([])
const indicatorStyle = ref({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: 0,
})

function updateIndicator() {
  const activeIndex = themeOptions.findIndex(
    (option) => option.value === themeStore.currentTheme
  )
  const btn = btnRefs.value[activeIndex]
  if (!btn) return

  indicatorStyle.value = {
    width: `${btn.offsetWidth}px`,
    height: `${btn.offsetHeight}px`,
    transform: `translateX(${btn.offsetLeft}px)`,
    opacity: 1,
  }
}

watch(
  () => themeStore.currentTheme,
  () => nextTick(updateIndicator)
)
onMounted(() => nextTick(updateIndicator))
</script>

<style scoped>
.toggle-theme {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 15px;
  background: var(--background);
  padding: 5px;
}
.toggle-theme__indicator {
  position: absolute;
  top: 5px;
  left: 0;
  border-radius: 10px;
  background: var(--accent);
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
.toggle-theme__btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 4px;
  cursor: pointer;
}

.icon-active > .sun {
  stroke: var(--on-accent);
}
.icon-active > .moon {
  stroke: var(--on-accent);
}
.icon-active > .monitor {
  stroke: var(--on-accent);
}

.sun {
  stroke: var(--text);
  fill: none;
}
.moon {
  stroke: var(--text);
  fill: none;
}
.monitor {
  stroke: var(--text);
  fill: none;
}
</style>
