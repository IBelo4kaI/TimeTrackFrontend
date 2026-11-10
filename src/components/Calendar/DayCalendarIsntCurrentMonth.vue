<template>
  <div class="day" :class="{ 'day-animate': animate, 'day-snowy': decorations.enabled }" @contextmenu.prevent>
    <div v-if="decorations.enabled" class="snow-pattern" aria-hidden="true">
      <svg
        v-for="(flake, index) in flakes"
        :key="index"
        class="snowflake"
        :style="flake"
        viewBox="0 0 24 24"
        focusable="false"
      >
        <path
          v-for="angle in [0, 60, 120]"
          :key="angle"
          :transform="`rotate(${angle} 12 12)`"
          d="M12 3V21 M9 5L12 8L15 5 M9 19L12 16L15 19"
          fill="none"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHolidayDecorationsStore } from '@/stores/holidayDecorations'

const decorations = useHolidayDecorationsStore()
const flakes = Array.from({ length: 12 }, (_, index) => ({
  left: `${5 + (index % 4) * 23 + Math.random() * 10}%`,
  top: `${7 + Math.floor(index / 4) * 29 + Math.random() * 12}%`,
  '--size': `${11 + Math.random() * 9}px`,
  '--duration': `${4 + Math.random() * 4}s`,
  '--delay': `${-Math.random() * 8}s`,
  '--tilt': `${Math.random() * 60 - 30}deg`,
}))

interface Props {
  animate?: boolean
}

withDefaults(defineProps<Props>(), {
  animate: false,
})
</script>

<style scoped>
.day {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  min-height: 8rem;
  min-width: 8rem;
  user-select: none;
  background: repeating-linear-gradient(
    150deg,
    transparent,
    transparent 10px,
    var(--foreground) 10px,
    var(--foreground) 20px
  );
}

.day-animate {
  background-size: 140%;
  animation: moveStripes infinite 0.5s linear;
}

.day-snowy { background: var(--foreground); }
.snow-pattern {
  position: absolute;
  inset: 0;
  color: var(--accent);
  opacity: .35;
  pointer-events: none;
}
.day-snowy.day-animate { animation: none; }
.snowflake {
  position: absolute;
  width: var(--size);
  height: var(--size);
  animation: snowDrift var(--duration) ease-in-out var(--delay) infinite alternate;
}
.day-animate .snowflake { animation-duration: calc(var(--duration) * .65); }

@keyframes snowDrift {
  from { transform: translate(-2px, -5px) rotate(var(--tilt)); opacity: .45; }
  to { transform: translate(2px, 5px) rotate(calc(var(--tilt) + 25deg)); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .day-animate, .day-animate .snowflake, .snowflake { animation: none; }
}

@keyframes moveStripes {
  from {
    background-position: -40px 0;
  }
  to {
    background-position: 0 0; /* Смещение создает эффект движения */
  }
}

@media (max-width: 768px) {
  .snowflake { width: calc(var(--size) * .7); height: calc(var(--size) * .7); }
  .snowflake:nth-child(2n) { display: none; }
  .day {
    min-height: 2rem;
    min-width: 2rem;
  }
}
</style>
