<template>
  <div class="select-field">
    <label v-if="label" class="select-label">{{ label }}</label>

    <div
      class="custom-select"
      :class="[`custom-select--${variant}`]"
      ref="selectRef"
      :style="fullWidth ? { width: '100%' } : {}"
    >
      <div
        class="select-trigger"
        :class="{
          'select-trigger--open': isOpen,
          'select-trigger--disabled': disabled,
          [`select-trigger--${variant}`]: true,
        }"
        @click="toggleDropdown"
        tabindex="0"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.space.prevent="toggleDropdown"
        @keydown.escape="closeDropdown"
      >
        <span class="select-value" :style="{ textAlign: align }">
          {{ displayValue }}
        </span>
        <svg
          class="select-icon"
          :class="{ 'select-icon--open': isOpen }"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <transition name="dropdown">
        <div v-if="isOpen" class="select-dropdown month-year-dropdown">
          <div class="my-year">
            <button
              type="button"
              class="my-year__nav"
              @click="panelYear--"
              aria-label="Предыдущий год"
            >
              ‹
            </button>
            <span class="my-year__value">{{ panelYear }}</span>
            <button
              type="button"
              class="my-year__nav"
              @click="panelYear++"
              aria-label="Следующий год"
            >
              ›
            </button>
          </div>

          <div class="my-months">
            <button
              v-for="(name, i) in MONTHS_SHORT"
              :key="i"
              type="button"
              class="my-month"
              :class="{
                'my-month--selected': month === i + 1 && year === panelYear,
                'my-month--today': isCurrentMonth(i),
              }"
              @click="selectMonth(i + 1)"
            >
              {{ name }}
            </button>
          </div>

          <div v-if="allowAllMonths" class="my-footer">
            <button
              type="button"
              class="my-reset"
              :class="{ 'my-reset--active': month == null }"
              @click="selectAllMonths"
            >
              Весь год
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { MONTH_NAMES } from '@/constants/calendar.constants'
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue'

const MONTHS_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3))

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'line', ''].includes(value),
  },
  align: {
    type: String,
    default: 'left',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  // Показывать ли пункт "Весь год" (сбрасывает month в null). Отключается,
  // когда месяц обязателен — там всегда должно быть какое-то конкретное
  // значение.
  allowAllMonths: {
    type: Boolean,
    default: true,
  },
})

// month — 1-12 или null ("весь год"), год — всегда конкретное число.
const month = defineModel('month', { type: Number, default: null })
const year = defineModel('year', { type: Number, required: true })

const isOpen = ref(false)
const selectRef = useTemplateRef('selectRef')

// Год, который сейчас пролистан внутри открытой панели — листается стрелками
// независимо от применённого фильтра, применяется только кликом по месяцу
// или "Весь год" (см. selectMonth/selectAllMonths).
const panelYear = ref(year.value)

const now = new Date()

const displayValue = computed(() =>
  month.value == null
    ? `Весь год · ${year.value}`
    : `${MONTH_NAMES[month.value - 1]} ${year.value}`
)

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) panelYear.value = year.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const selectMonth = (m) => {
  month.value = m
  year.value = panelYear.value
  closeDropdown()
}

const selectAllMonths = () => {
  month.value = null
  year.value = panelYear.value
  closeDropdown()
}

const isCurrentMonth = (i) =>
  i === now.getMonth() && panelYear.value === now.getFullYear()

const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    closeDropdown()
  }
}

watch(isOpen, (open) => {
  if (open) document.addEventListener('click', handleClickOutside)
  else document.removeEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.select-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 100%;
}

.select-label {
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 500;
}

.custom-select {
  position: relative;
  max-width: 100%;
  display: inline-block;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.57rem 0.86rem;
  background-color: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: border-color 0.2s;
  outline: none;
  height: 3rem;
  font-size: 1rem;
}

.select-trigger:hover:not(.select-trigger--disabled) {
  border-color: var(--accent);
}

.select-trigger:focus {
  border-color: var(--accent);
}

.select-trigger--open {
  border-color: var(--accent);
}

.select-trigger--disabled {
  background-color: var(--muted-foreground);
  cursor: not-allowed;
  opacity: 0.6;
}

.select-value {
  flex: 1;
  color: var(--text);
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-icon {
  flex-shrink: 0;
  color: var(--muted-text);
  transition: transform 0.2s ease;
}

.select-icon--open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  background-color: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1000;
}

/* Анимация выпадающей панели — как у SelectUI.vue */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* variant: line */
.select-trigger--line {
  background-color: transparent;
  border: none;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
}

.custom-select--line .select-dropdown {
  top: 100%;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.select-trigger--line:hover:not(.select-trigger--disabled) {
  border-bottom: 0.07rem solid var(--accent);
}

.select-trigger--line:focus {
  border-bottom: 0.07rem solid var(--accent);
}

.select-trigger--line.select-trigger--open {
  border-bottom: 0.07rem solid var(--accent);
}

/* ---------- содержимое панели: год + сетка месяцев ---------- */

.month-year-dropdown {
  width: 15.5rem;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.my-year {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.my-year__nav {
  width: 1.9rem;
  height: 1.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--muted-text);
  cursor: pointer;
  font-size: 0.85rem;
}

.my-year__nav:hover {
  background: var(--muted-foreground);
  color: var(--text);
}

.my-year__value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  font-size: 0.98rem;
}

.my-months {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
}

.my-month {
  padding: 0.5rem 0.2rem;
  border: 0.07rem solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  text-transform: capitalize;
}

.my-month:hover {
  background: var(--muted-foreground);
}

.my-month--today {
  border-color: var(--border-color);
}

.my-month--selected {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

.my-footer {
  display: flex;
  padding-top: 0.6rem;
  border-top: 0.07rem solid var(--border-color);
}

.my-reset {
  background: transparent;
  border: none;
  color: var(--muted-text);
  font: inherit;
  font-size: 0.83rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.2rem 0;
}

.my-reset:hover {
  color: var(--accent);
}

.my-reset--active {
  color: var(--accent);
}
</style>
