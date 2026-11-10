<template>
  <section
    class="new-year-countdown"
    aria-label="Обратный отсчёт до Нового года по московскому времени"
  >
    <div class="countdown-title">
      <i class="fa-regular fa-snowflake" aria-hidden="true"></i>
      <span>До Нового года</span>
      <span class="countdown-year">{{ targetYear }}</span>
    </div>
    <div class="countdown-values" role="timer" aria-live="off">
      <div v-for="part in parts" :key="part.label" class="countdown-part">
        <strong>{{ String(part.value).padStart(2, '0') }}</strong>
        <span>{{ part.label }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const now = ref(Date.now())
const yearFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
})
const targetYear = computed(() => Number(yearFormatter.format(now.value)) + 1)
const remaining = computed(() =>
  Math.max(
    0,
    Math.ceil(
      (Date.parse(`${targetYear.value}-01-01T00:00:00+03:00`) - now.value) /
        1000
    )
  )
)
const parts = computed(() => [
  { value: Math.floor(remaining.value / 86400), label: 'дней' },
  { value: Math.floor(remaining.value / 3600) % 24, label: 'часов' },
  { value: Math.floor(remaining.value / 60) % 60, label: 'минут' },
  { value: remaining.value % 60, label: 'секунд' },
])

let interval
onMounted(() => {
  now.value = Date.now()
  interval = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => window.clearInterval(interval))
</script>

<style scoped>
.new-year-countdown {
  padding: 0.85rem 0.65rem;
  color: var(--text);
  background: var(--muted-accent);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
.countdown-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.countdown-title i {
  color: var(--accent);
}
.countdown-year {
  margin-left: auto;
  color: var(--accent);
  font-size: 0.75rem;
}
.countdown-values {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.3rem;
  margin-top: 0.75rem;
}
.countdown-part {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}
.countdown-part strong {
  color: var(--accent);
  font-size: 1.25rem;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.countdown-part span {
  color: var(--muted-text);
  font-size: 0.6rem;
}
</style>
