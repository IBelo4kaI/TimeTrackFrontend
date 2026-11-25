<template>
  <svg
    ref="garland"
    class="header-garland"
    width="100%"
    :height="garlandHeight"
    aria-hidden="true"
    focusable="false"
  >
    <g :transform="`scale(${garlandScale})`">
      <g v-for="section in sections" :key="section" :transform="`translate(${(section - 1) * sectionWidth} 0)`">
        <path class="wire" d="M0 2 Q200 12 400 2 Q600 12 800 2" />
        <g
          v-for="bulb in bulbs"
          :key="bulb.x"
          class="light"
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
          <rect
            class="bulb-hover-area"
            :x="-bulbSpacing / 2"
            :y="5.75 - bulb.y"
            :width="bulbSpacing"
            :height="garlandHeight / garlandScale"
            fill="transparent"
          />
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const garland = ref(null)
const sections = ref(1)
const sectionWidth = 800
const garlandHeight = 36
const garlandScale = .85
const bulbSpacing = 40
const colors = ['#ff657a', '#ffc857', '#45d6a0', '#67b7ff']
const bulbs = Array.from({ length: sectionWidth / bulbSpacing }, (_, index) => {
  const x = (index + .5) * bulbSpacing
  const t = (x % 400) / 400
  return { x, y: 2 + 20 * t * (1 - t), color: colors[index % colors.length] }
})

let resizeObserver
onMounted(() => {
  const svg = garland.value
  const updateSections = () => {
    sections.value = Math.ceil(svg.getBoundingClientRect().width / (sectionWidth * garlandScale))
  }
  updateSections()
  resizeObserver = new ResizeObserver(updateSections)
  resizeObserver.observe(svg)
})
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style scoped>
.header-garland {
  position: absolute;
  left: 0;
  bottom: -29px;
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
  filter: brightness(1) drop-shadow(0 1px 3px var(--bulb-color));
  transition: filter .22s ease-out;
}

@media (any-hover: hover) {
  .bulb-hover-area {
    pointer-events: fill;
  }

  .light:hover .bulb {
    filter: brightness(1.45) drop-shadow(0 0 6px var(--bulb-color));
    transition-duration: .08s;
  }
}

@media (prefers-reduced-motion: reduce) {
  .light .bulb {
    transition: none;
  }
}

@media print {
  .header-garland {
    display: none;
  }
}
</style>
