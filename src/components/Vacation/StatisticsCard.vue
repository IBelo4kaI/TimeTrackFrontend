<template>
  <div class="stat-card">
    <div class="stat-column-gap">
      <div class="stat-row">
        <div class="stat-icon" :class="iconVariant" v-if="icon != ''">
          <i :class="[icon]"></i>
        </div>
        <div class="stat-column">
          <div class="stat-label">{{ label }}</div>
          <div class="stat-value" :class="valueVariant">
            <i v-if="isLoading" class="fa-regular fa-loader fa-spin"></i>
            <template v-else>
              {{ formatStats(value) }}
            </template>
          </div>
        </div>
      </div>
      <Progress
        :variant="valueVariant"
        v-if="progress || progress > -1"
        :progress="progress"
      />
    </div>
  </div>
</template>

<script setup>
import Progress from '@/components/Progress.vue'
import { formatStats } from '@/utils/vacation.utils'

const props = defineProps({
  // Заголовок карточки
  label: {
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

  value: {
    type: [String, Number],
    default: 0,
  },

  progress: {
    type: [String, Number],
  },

  // Вариант цвета иконки: 'primary' | 'success' | 'warn' | 'destructive'
  valueVariant: {
    type: String,
    default: 'primary',
    validator: (value) =>
      ['primary', 'success', 'warn', 'destructive'].includes(value),
  },

  isLoading: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.stat-card {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  max-width: 40rem;
  width: 100%;
}

.stat-column {
  display: flex;
  flex-direction: column;
}

.stat-column-gap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-row {
  display: flex;
  gap: 0.75rem;
}

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
  text-wrap-mode: nowrap;
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
</style>
