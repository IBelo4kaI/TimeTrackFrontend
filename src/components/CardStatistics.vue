<template>
  <div
    class="stat-card"
    :class="{ hoverable }"
    :role="hoverable ? 'button' : null"
    :tabindex="hoverable ? 0 : null"
    @click="onActivate"
    @keydown.enter="onActivate"
    @keydown.space.prevent="onActivate"
  >
    <!-- Режим "панель": иконка+подпись сверху, ниже список строк (label/value) -->
    <template v-if="rows.length">
      <div class="stat-header">
        <div class="stat-icon" :class="iconVariant" v-if="icon" aria-hidden="true">
          <i v-if="isIconClass" :class="icon"></i>
          <template v-else>{{ icon }}</template>
        </div>
        <div class="stat-title">{{ label }}</div>
      </div>

      <div class="stat-rows">
        <div
          v-for="(row, index) in rows"
          :key="row.id ?? index"
          class="stat-row-line"
        >
          <span class="stat-row-label">{{ row.label }}</span>
          <span class="stat-row-value" :class="row.valueVariant ?? 'primary'">
            <i v-if="isLoading" class="fa-regular fa-loader fa-spin"></i>
            <template v-else>{{ row.value }}</template>
          </span>
        </div>
      </div>
    </template>

    <!-- Режим "плитка": иконка слева, подпись+значение справа -->
    <template v-else-if="!$slots.default">
      <div class="stat-row">
        <div class="stat-icon" :class="iconVariant" v-if="icon" aria-hidden="true">
          <i v-if="isIconClass" :class="icon"></i>
          <template v-else>{{ icon }}</template>
        </div>
        <div class="stat-column">
          <div class="stat-label">{{ label }}</div>
          <div class="stat-value" :class="valueVariant">
            <i v-if="isLoading" class="fa-regular fa-loader fa-spin"></i>
            <template v-else>{{ value }}</template>
          </div>
        </div>
      </div>
    </template>

    <!-- Режим "кастом": произвольное содержимое карточки через слот -->
    <slot />

    <div class="stat-progress" v-if="progress != null">
      <Progress :variant="progressVariant" :progress="progress" />
      <div class="progress-label" v-if="progressLabel">
        <span>{{ progressLabel }}</span>
        <span>{{ formattedProgress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Progress from './Progress.vue'

const props = defineProps({
  // Подпись карточки. В режиме "плитка" — над значением, в режиме
  // "панель" — заголовок сверху.
  label: {
    type: String,
    default: '',
  },

  // Иконка: fa-класс ("fa-regular fa-calendar") или произвольный текст/эмодзи.
  icon: {
    type: String,
    default: '',
  },

  // Цвет фона/иконки: 'primary' | 'success' | 'warn' | 'destructive'
  iconVariant: {
    type: String,
    default: 'primary',
    validator: (v) =>
      ['primary', 'success', 'warn', 'destructive', 'accent'].includes(v),
  },

  // Одиночное значение (режим "плитка"). Игнорируется, если задан rows
  // или используется слот.
  value: {
    type: [String, Number],
    default: '',
  },

  // Цвет значения: 'primary' | 'success' | 'warn' | 'destructive'
  valueVariant: {
    type: String,
    default: 'primary',
    validator: (v) =>
      ['primary', 'success', 'warn', 'destructive', 'accent'].includes(v),
  },

  // Список строк [{ label, value, valueVariant? }] — режим "панель".
  // Если непустой, используется вместо value.
  rows: {
    type: Array,
    default: () => [],
  },

  // Прогресс-бар (0-100). Не показывается, если null/undefined.
  progress: {
    type: [String, Number],
    default: null,
  },
  progressLabel: {
    type: String,
    default: '',
  },
  progressVariant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warn', 'destructive'].includes(v),
  },

  isLoading: {
    type: Boolean,
    default: false,
  },

  // Включить hover/клик по карточке целиком (событие click).
  hoverable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const isIconClass = computed(() => props.icon.startsWith('fa-'))

const formattedProgress = computed(() => {
  if (props.progress == null) return 0
  return Math.round(Number(props.progress) * 10) / 10
})

function onActivate() {
  if (props.hoverable) emit('click')
}
</script>

<style scoped>
.stat-card {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card.hoverable {
  cursor: pointer;
}

.stat-card.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.stat-card.hoverable:focus {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.stat-card.hoverable:focus:not(:focus-visible) {
  outline: none;
}

.stat-card.hoverable:active {
  transform: translateY(0);
}

/* --- иконка (общая для обоих режимов) --- */
.stat-icon {
  width: 3.14rem;
  height: 3.14rem;
  border-radius: calc(var(--border-radius) * 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.primary {
  background: var(--muted-accent);
  color: var(--accent);
}

.stat-icon.success {
  background: var(--muted-success);
  color: var(--success);
}

.stat-icon.warn {
  background: var(--muted-warn);
  color: var(--warn);
}

.stat-icon.destructive {
  background: var(--muted-destructive);
  color: var(--destructive);
}

.stat-icon.accent {
  background: var(--muted-accent);
  color: var(--accent);
}

/* --- режим "плитка" --- */
.stat-row {
  display: flex;
  gap: 0.75rem;
}

.stat-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 700;
  flex: 1;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
}

.stat-value.success {
  color: var(--success);
}
.stat-value.warn {
  color: var(--warn);
}
.stat-value.destructive {
  color: var(--destructive);
}
.stat-value.primary {
  color: var(--accent);
}
.stat-value.accent {
  color: var(--accent);
}

/* --- режим "панель" --- */
.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-title {
  font-size: 1.14rem;
  color: var(--text);
  font-weight: 600;
}

.stat-rows {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-row-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.71rem;
  padding: calc(var(--padding-secondary) / 2);
  background: var(--muted-foreground);
  border-radius: calc(var(--border-radius) * 0.6);
}

.stat-row-label {
  font-size: 0.93rem;
  color: var(--muted-text);
  font-weight: 500;
}

.stat-row-value {
  font-size: 1.43rem;
  font-weight: 700;
  color: var(--text);
  text-wrap-mode: nowrap;
}

.stat-row-value.success {
  color: var(--success);
}
.stat-row-value.warn {
  color: var(--warn);
}
.stat-row-value.destructive {
  color: var(--destructive);
}
.stat-row-value.accent {
  color: var(--accent);
}
.stat-row-value.primary {
  color: var(--text);
}

/* --- прогресс (общий) --- */
.stat-progress {
  padding-top: 0.75rem;
  border-top: 0.07rem solid var(--border-color);
}

.progress-label {
  margin-top: 0.5rem;
  font-size: 0.86rem;
  color: var(--muted-text);
  display: flex;
  justify-content: space-between;
}
</style>
