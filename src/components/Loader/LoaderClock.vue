<template>
  <div class="clock-loader">
    <svg width="40" height="40" viewBox="0 0 80 80" style="overflow: visible">
      <circle
        ref="bgCircleRef"
        cx="40"
        cy="40"
        r="0"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      />
      <line
        ref="hHandRef"
        x1="40"
        y1="40"
        x2="24"
        y2="40"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        opacity="0"
      />
      <line
        ref="mHandRef"
        x1="40"
        y1="40"
        x2="40"
        y2="18"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0"
      />
      <circle
        ref="dotRef"
        cx="40"
        cy="40"
        r="2.5"
        fill="currentColor"
        opacity="0"
      />
    </svg>
    <span
      v-if="label"
      ref="lblRef"
      class="clock-loader__label"
      style="opacity: 0"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

interface Props {
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
})

const bgCircleRef = useTemplateRef<SVGCircleElement>('bgCircleRef')
const hHandRef = useTemplateRef<SVGLineElement>('hHandRef')
const mHandRef = useTemplateRef<SVGLineElement>('mHandRef')
const dotRef = useTemplateRef<SVGCircleElement>('dotRef')
const lblRef = useTemplateRef<HTMLSpanElement>('lblRef')

let tl: gsap.core.Timeline | null = null

const reset = () => {
  gsap.set(bgCircleRef.value, { attr: { r: 0 }, opacity: 1 })
  gsap.set([hHandRef.value, mHandRef.value, dotRef.value], {
    opacity: 0,
    clearProps: 'transform',
  })
  if (lblRef.value) gsap.set(lblRef.value, { opacity: 0 })
}

onMounted(() => {
  tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5, onRepeat: reset })

  tl.to(bgCircleRef.value, {
    attr: { r: 36 },
    duration: 0.6,
    ease: 'elastic.out',
  })
    .to(
      [hHandRef.value, mHandRef.value, dotRef.value],
      { opacity: 1, duration: 0.01 },
      '+=0.05'
    )
    .from(
      hHandRef.value,
      { attr: { x2: 40, y2: 40 }, duration: 0.2, ease: 'power2.out' },
      '<'
    )
    .from(
      mHandRef.value,
      { attr: { x2: 40, y2: 40 }, duration: 0.2, ease: 'power2.out' },
      '<+0.1'
    )

  if (lblRef.value) {
    tl.to(lblRef.value, { opacity: 1, duration: 0.2 })
  }

  tl.to({}, { duration: 0.2 }).to(
    [
      bgCircleRef.value,
      hHandRef.value,
      mHandRef.value,
      dotRef.value,
      ...(lblRef.value ? [lblRef.value] : []),
    ],
    { opacity: 0, duration: 0.3, ease: 'power2.in' }
  )
})

onBeforeUnmount(() => {
  tl?.kill()
})
</script>

<style scoped>
.clock-loader {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.3rem;
  color: var(--text);
}

.clock-loader__label {
  font-size: 1rem;
  color: var(--muted-text);
  letter-spacing: 0.04em;
}
</style>
