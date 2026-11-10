<template>
  <svg
    class="header-garland"
    width="100%"
    height="24"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <pattern
        :id="patternId"
        width="800"
        height="28"
        patternUnits="userSpaceOnUse"
        patternTransform="scale(.85)"
      >
        <path class="wire" d="M0 2 Q200 12 400 2 Q600 12 800 2" />
        <g
          v-for="bulb in bulbs"
          :key="bulb.x"
          :transform="`translate(${bulb.x} ${bulb.y - 5.75})`"
        >
          <path class="wire" d="M0 5.75 V10" />
          <rect class="socket" x="-3" y="9" width="6" height="4" rx="1" />
          <ellipse
            class="bulb"
            cx="0"
            cy="17"
            rx="4"
            ry="6"
            :fill="bulb.color"
            :style="{ '--bulb-color': bulb.color }"
          />
          <ellipse cx="-1" cy="15" rx="1" ry="2" fill="white" opacity=".65" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="24" :fill="`url(#${patternId})`" />
  </svg>
</template>

<script setup>
import { useId } from 'vue'

const patternId = `header-garland-${useId()}`
const colors = ['#ff657a', '#ffc857', '#45d6a0', '#67b7ff']
const bulbs = Array.from({ length: 20 }, (_, index) => {
  const x = 20 + index * 40
  const t = (x % 400) / 400
  return { x, y: 2 + 20 * t * (1 - t), color: colors[index % colors.length] }
})
</script>

<style scoped>
.header-garland {
  position: absolute;
  left: 0;
  bottom: -17px;
  z-index: 1;
  pointer-events: none;
}

.wire {
  fill: none;
  stroke: #46665a;
  stroke-width: 1.3;
}

.socket {
  fill: #46665a;
}
.bulb {
  filter: drop-shadow(0 1px 3px var(--bulb-color));
}

@media print {
  .header-garland {
    display: none;
  }
}
</style>
