<template>
  <button
    type="button"
    class="holiday-toggle"
    :class="{ active: decorations.enabled }"
    :aria-pressed="decorations.enabled"
    aria-label="Новогоднее оформление"
    :title="decorations.enabled ? 'Отключить новогоднее оформление' : 'Включить новогоднее оформление'"
    @click="decorations.toggle"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path
        v-for="angle in [0, 60, 120]"
        :key="angle"
        :transform="`rotate(${angle} 12 12)`"
        d="M12 3V21 M9 5L12 8L15 5 M9 19L12 16L15 19"
      />
    </svg>
  </button>
</template>

<script setup>
import { useHolidayDecorationsStore } from '@/stores/holidayDecorations'

const decorations = useHolidayDecorationsStore()
</script>

<style scoped>
.holiday-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2.857rem;
  height: 2.857rem;
  border: 1px solid transparent;
  border-radius: 1.071rem;
  background: var(--background);
  color: var(--muted-text);
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
}
.holiday-toggle svg { display: block; width: 1.5rem; height: 1.5rem; flex-shrink: 0; }
.holiday-toggle.active { background: var(--muted-accent); color: var(--accent); }
.holiday-toggle:hover { border-color: var(--accent); }
.holiday-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
