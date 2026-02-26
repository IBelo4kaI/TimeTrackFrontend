<template>
  <div
    class="custom-select"
    ref="selectRef"
    :style="computedWidth ? { width: computedWidth + 'px' } : {}"
  >
    <div
      class="select-trigger"
      :class="{
        'select-trigger--open': isOpen,
        'select-trigger--disabled': disabled,
        'select-trigger--error': error,
      }"
      @click="toggleDropdown"
      tabindex="0"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeDropdown"
      @keydown.down.prevent="navigateOptions(1)"
      @keydown.up.prevent="navigateOptions(-1)"
    >
      <span
        class="select-value"
        :class="{ 'select-placeholder': !selectedOption }"
      >
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
    <!-- Скрытый измеритель ширины -->
    <div class="select-sizer" ref="sizerRef" aria-hidden="true">
      <div class="select-trigger">
        <span
          class="select-value"
          v-for="option in options"
          :key="getOptionValue(option)"
        >
          {{ getOptionLabel(option) }}
        </span>
      </div>
    </div>
    <transition name="dropdown">
      <div v-if="isOpen" class="select-dropdown">
        <div class="select-options">
          <div
            v-for="(option, index) in options"
            :key="getOptionValue(option)"
            class="select-option"
            :class="{
              'select-option--selected': isSelected(option),
              'select-option--focused': focusedIndex === index,
            }"
            @click="selectOption(option)"
            @mouseenter="focusedIndex = index"
          >
            {{ getOptionLabel(option) }}
            <svg
              v-if="isSelected(option)"
              class="select-check"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M13.3333 4L6 11.3333L2.66667 8"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onUnmounted,
  watch,
  useTemplateRef,
  onMounted,
  nextTick,
} from 'vue'

const sizerRef = useTemplateRef('sizerRef')
const computedWidth = ref(null)

const measureWidth = () => {
  if (!sizerRef.value) return
  const spans = sizerRef.value.querySelectorAll('.select-value')
  let max = 0
  spans.forEach((el) => {
    const w = el.scrollWidth
    if (w > max) max = w
  })
  // +иконка (20px) + gap (8px) + padding (2 * 0.86rem ≈ 27px)
  const calculated = max + 20 + 8 + 28
  // Ограничиваем шириной viewport минус небольшой отступ
  computedWidth.value = Math.min(calculated, window.innerWidth - 32)
}

const props = defineProps({
  options: {
    type: Array,
    required: true,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: 'Выберите опцию',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  labelKey: {
    type: [String, Array],
    default: 'label',
  },
  valueKey: {
    type: String,
    default: 'value',
  },
  labelSeparator: {
    type: String,
    default: ' ',
  },
  error: {
    type: Boolean,
    default: false,
  },
})

const model = defineModel()
const emit = defineEmits(['change'])

const isOpen = ref(false)
const selectRef = useTemplateRef('selectRef')
const focusedIndex = ref(-1)

const selectedOption = computed(() => {
  if (!model.value) return null

  return props.options.find((option) => {
    const optionValue = getOptionValue(option)
    return optionValue === model.value
  })
})

const displayValue = computed(() => {
  if (selectedOption.value) {
    return getOptionLabel(selectedOption.value)
  }
  return props.placeholder
})

const getOptionLabel = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }

  // Если labelKey - массив, объединяем значения
  if (Array.isArray(props.labelKey)) {
    return props.labelKey
      .map((key) => option[key])
      .filter((val) => val != null && val !== '') // Убираем пустые значения
      .join(props.labelSeparator)
  }

  return option[props.labelKey]
}

const getOptionValue = (option) => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  return option[props.valueKey]
}

const isSelected = (option) => {
  if (!model.value) return false
  return getOptionValue(option) === model.value
}

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value

  if (isOpen.value) {
    // Найти индекс выбранной опции
    const selectedIndex = props.options.findIndex((opt) => isSelected(opt))
    focusedIndex.value = selectedIndex >= 0 ? selectedIndex : 0
  }
}

const closeDropdown = () => {
  isOpen.value = false
  focusedIndex.value = -1
}

const selectOption = (option) => {
  const value = getOptionValue(option)
  model.value = value
  emit('change', value)
  closeDropdown()
}

const navigateOptions = (direction) => {
  if (!isOpen.value) {
    isOpen.value = true
    return
  }

  const newIndex = focusedIndex.value + direction

  if (newIndex >= 0 && newIndex < props.options.length) {
    focusedIndex.value = newIndex
  } else if (newIndex < 0) {
    focusedIndex.value = props.options.length - 1
  } else {
    focusedIndex.value = 0
  }
}

const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    closeDropdown()
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

onMounted(() => nextTick(measureWidth))
watch(
  () => props.options,
  () => nextTick(measureWidth),
  { deep: true }
)
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.custom-select {
  position: relative;
  min-width: 120px;
  max-width: 100%; /* не выходить за родителя */
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
.select-trigger--error {
  border-color: var(--destructive);
}

.select-value {
  flex: 1;
  color: var(--text);
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-placeholder {
  color: var(--muted-text);
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
  right: 0;
  background-color: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  max-height: 300px;
  overflow: hidden;
}

.select-options {
  overflow-y: auto;
  max-height: 300px;
  padding: 0.5rem 0;
}

.select-options::-webkit-scrollbar {
  width: 6px;
}

.select-options::-webkit-scrollbar-track {
  background: var(--muted-foreground);
}

.select-options::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.select-options::-webkit-scrollbar-thumb:hover {
  background: var(--muted-text);
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.57rem 0.86rem;
  margin: 0 0.5rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--text);
  font-size: 1rem;
}

.select-option:hover,
.select-option--focused {
  background-color: var(--muted-accent);
  color: var(--accent);
}

.select-option--selected {
  background-color: var(--muted-accent);
  color: var(--accent);
  font-weight: 500;
}

.select-check {
  flex-shrink: 0;
  color: var(--accent);
}

/* Анимация выпадающего списка */
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

/* Исправлено: sizer вынесен за пределы viewport через fixed, не влияет на layout */
.select-sizer {
  position: fixed;
  visibility: hidden;
  pointer-events: none;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  top: -9999px;
  left: -9999px;
}
</style>
