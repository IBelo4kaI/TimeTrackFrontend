<template>
  <div
    class="stat-card"
    :class="{ hoverable }"
    @click="hoverable ? handleClick() : null"
    :role="hoverable ? 'button' : null"
    :tabindex="hoverable ? 0 : null"
    @keydown.enter="hoverable ? handleClick() : null"
    @keydown.space.prevent="hoverable ? handleClick() : null"
  >
    <div class="stat-card-header">
      <div
        v-if="icon != ''"
        class="stat-icon"
        :class="iconVariant"
        aria-hidden="true"
      >
        <!-- <i :class="icon"></i> -->
        {{ icon }}
      </div>
      <div class="stat-title">{{ title }}</div>
    </div>

    <div class="stat-rows">
      <div v-for="(row, index) in rows" :key="row.id || index" class="stat-row">
        <span class="stat-row-label">{{ row.label }}</span>
        <span class="stat-row-value" :class="row.valueVariant">
          <i v-if="isLoading" class="fa-regular fa-loader fa-spin"></i>
          <template v-else>
            {{ row.value }}
          </template>
        </span>
      </div>
    </div>

    <div v-if="showProgress" class="stat-progress">
      <div
        class="progress-bar-container"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="progress-bar-fill"
          :class="progressVariant"
          :style="{ width: formattedProgress + '%' }"
        ></div>
      </div>
      <div class="progress-label">
        <span>{{ progressLabel }}</span>
        <span>{{ formattedProgress }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Заголовок карточки
  title: {
    type: String,
    required: true,
  },

  // Иконка (эмодзи или текст)
  icon: {
    type: String,
    default: '',
  },

  // Вариант цвета иконки: 'primary' | 'success' | 'warn' | 'destructive'
  iconVariant: {
    type: String,
    default: 'primary',
    validator: (value) =>
      ['primary', 'success', 'warn', 'destructive'].includes(value),
  },

  // Массив строк данных
  // Пример: [{ label: 'Норма часов', value: '184 ч', valueVariant: 'success' }]
  rows: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(
        (row) =>
          typeof row.label === 'string' &&
          (typeof row.value === 'string' || typeof row.value === 'number')
      )
    },
  },

  // Показывать ли прогресс-бар
  showProgress: {
    type: Boolean,
    default: false,
  },

  // Процент для прогресс-бара (0-100)
  progressPercent: {
    type: Number,
    default: 0,
  },

  // Текст для прогресс-бара
  progressLabel: {
    type: String,
    default: 'Выполнено',
  },

  // Вариант цвета прогресс-бара: 'primary' | 'success' | 'warn'
  progressVariant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warn'].includes(value),
  },

  isLoading: {
    type: Boolean,
    default: false,
  },

  // Включить эффект hover
  hoverable: {
    type: Boolean,
    default: true,
  },
})

// Событие при клике на карточку
const emit = defineEmits(['click'])

// Форматирование процента (округление до 1 знака после запятой)
const formattedProgress = computed(() => {
  return Math.round(props.progressPercent * 10) / 10
})

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.stat-card {
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  padding: var(--padding-primary);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
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

.stat-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.stat-icon {
  width: 3.14rem;
  height: 3.14rem;
  border-radius: calc(var(--border-radius) * 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.57rem;
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

.stat-row {
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

.stat-progress {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 0.07rem solid var(--border-color);
}

.progress-bar-container {
  height: 0.57rem;
  background: var(--muted-foreground);
  border-radius: 0.29rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 0.29rem;
  transition: width 0.3s ease;
}

.progress-bar-fill.primary {
  background: var(--accent);
}

.progress-bar-fill.success {
  background: var(--success);
}

.progress-bar-fill.warn {
  background: var(--warn);
}

.progress-label {
  font-size: 0.86rem;
  color: var(--muted-text);
  display: flex;
  justify-content: space-between;
}
</style>
