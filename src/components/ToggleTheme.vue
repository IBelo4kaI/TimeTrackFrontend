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
      <i
        v-if="option.value === themeStore.THEMES.LIGHT"
        class="fa-regular fa-sun"
      ></i>
      <!-- DARK: moon -->
      <i
        v-else-if="option.value === themeStore.THEMES.DARK"
        class="fa-regular fa-moon"
      ></i>
      <!-- SYSTEM: monitor -->
      <i v-else class="fa-solid fa-display"></i>
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
  height: 40px;
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
  height: 30px;
  width: 30px;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  padding: 5px;
  cursor: pointer;
  color: var(--text);
  font-size: 1rem;
  transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.toggle-theme__btn.active {
  color: var(--on-accent);
}
</style>
