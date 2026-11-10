<template>
  <div class="sidebar-title">
    <div class="sidebar-title__icon">
      <svg
        width="2.5rem"
        height="2.5rem"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="20"
          y1="19"
          x2="20"
          y2="10"
          stroke="#0060E6"
          stroke-width="2"
          stroke-linecap="round"
          :transform="`rotate(${minuteDeg} 20 20)`"
        />
        <line
          x1="20"
          y1="19"
          x2="20"
          y2="12"
          stroke="#0060E6"
          stroke-width="2"
          stroke-linecap="round"
          :transform="`rotate(${hourDeg} 20 20)`"
        />
        <circle cx="20" cy="20" r="2" fill="#0060E6" />
        <circle cx="20" cy="20" r="15" stroke="#0060E6" stroke-width="2" />
        <g aria-hidden="true" transform="rotate(-12 20 5)">
          <path
            d="M6 4 C8 -4 16 -11 26 -9 C32 -8 35 -4 34 1 L31 2 C31 -2 29 -3 26 -2 L29 4 Z"
            fill="#e53950"
          />
          <path d="M6 4 C9 -3 15 -8 21 -9 C16 -4 16 0 18 4 Z" fill="#f45a68" />
          <rect x="4" y="1" width="27" height="7" rx="3.5" fill="#fff" stroke="#dce2eb" stroke-width=".8" />
          <circle cx="33.5" cy="2" r="4" fill="#fff" stroke="#dce2eb" stroke-width=".8" />
        </g>
      </svg>
    </div>
    <div class="sidebar-title__column">
      <div class="sidebar-title__title">Timetrack</div>
      <div class="sidebar-title__desc">Учет рабочего времени</div>
    </div>
    <!-- Кнопка закрытия внутри сайдбара (мобилка) -->
    <button
      class="sidebar-close-btn"
      @click="emit('close')"
      aria-label="Закрыть меню"
    >
      <i class="fa-light fa-xmark" />
    </button>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['close'])

const hourDeg = ref(0)
const minuteDeg = ref(0)

let raf = 0

function updateClock() {
  const now = new Date()

  const hours = now.getHours() % 12
  const minutes = now.getMinutes()

  const hour = hours + minutes / 60

  minuteDeg.value = minutes * 6
  hourDeg.value = hour * 30

  raf = requestAnimationFrame(updateClock)
}

onMounted(() => {
  updateClock()
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})
</script>
<style scoped>
.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.313rem;
  height: var(--header-height);
  padding: 0.714rem;
  border-bottom: 0.07rem solid var(--border-color);
}

.sidebar-title__icon {
  display: flex;
  align-items: center;
}

.sidebar-title__icon svg {
  overflow: visible;
}

.sidebar-title__column {
}

.sidebar-title__title {
  font-weight: 700;
  font-size: 1rem;
}

.sidebar-title__desc {
  font-size: 0.725rem;
}

.sidebar-close-btn {
  display: none;
  margin-left: auto;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  color: var(--text-secondary, #888);
  font-size: 1.1rem;
  line-height: 1;
  border-radius: 0.25rem;
  transition:
    color 0.15s,
    background 0.15s;
}

.sidebar-close-btn:hover {
  color: var(--text-primary, #333);
  background: var(--background-hover, rgba(0, 0, 0, 0.06));
}

@media (max-width: 768px) {
  .sidebar-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
