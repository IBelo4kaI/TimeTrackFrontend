<template>
  <div class="custom-input" ref="wrapperRef">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <div class="input-wrapper">
      <span v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix" />
      </span>
      <input
        :id="inputId"
        ref="inputRef"
        :value="searchQuery"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        autocomplete="off"
        :class="[
          'input-field',
          { 'input-field--error': error },
          { 'input-field--with-prefix': $slots.prefix },
          { 'input-field--with-suffix': $slots.suffix || showClear },
          { 'input-field--with-create': showInsideButton },
          {
            'input-field--with-clear-and-create': showInsideButton && showClear,
          },
        ]"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <span v-if="$slots.suffix && !showClear" class="input-suffix">
        <slot name="suffix" />
      </span>
      <span
        v-if="showClear"
        class="input-suffix input-clear"
        :class="{ 'input-clear--offset': showInsideButton }"
        @mousedown.prevent="clearSelection"
        title="Очистить"
      >
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <button
        v-if="showInsideButton"
        class="input-create-btn"
        :style="{ right: showClear ? '2.2rem' : '0.4rem' }"
        type="button"
        @mousedown.prevent="handleCreate"
      >
        {{ buttonText }}
      </button>
    </div>

    <Transition name="dropdown">
      <ul
        v-if="
          isOpen &&
          (filteredOptions.length > 0 || showDropdownButton) &&
          !loading
        "
        ref="listRef"
        class="autocomplete-list"
        role="listbox"
      >
        <!-- Кнопка сверху -->
        <li
          v-if="showDropdownButton && buttonPosition === 'dropdown-top'"
          class="autocomplete-item autocomplete-item--create"
          @mousedown.prevent="handleCreate"
        >
          {{ buttonText }}
        </li>

        <!-- лоадер внутри списка -->
        <li v-if="loading" class="autocomplete-item autocomplete-item--loading">
          <span class="loading-dot" />
          <span class="loading-dot" />
          <span class="loading-dot" />
        </li>

        <template v-else>
          <li
            v-for="(option, index) in filteredOptions"
            :key="getOptionValue(option)"
            :class="[
              'autocomplete-item',
              { 'autocomplete-item--active': index === activeIndex },
            ]"
            role="option"
            :aria-selected="index === activeIndex"
            @mousedown.prevent="selectOption(option)"
            @mousemove="activeIndex = index"
          >
            <slot name="option" :option="option" :query="searchQuery">
              <span
                class="autocomplete-item__text"
                v-html="highlight(getOptionLabel(option))"
              />
            </slot>
          </li>
        </template>

        <!-- Кнопка снизу -->
        <li
          v-if="showDropdownButton && buttonPosition === 'dropdown-bottom'"
          class="autocomplete-item autocomplete-item--create"
          @mousedown.prevent="handleCreate"
        >
          {{ buttonText }}
        </li>
      </ul>
      <div
        v-else-if="isOpen && searchQuery.length >= minChars && !loading"
        class="autocomplete-empty"
      >
        <slot name="empty">{{ emptyText }}</slot>
      </div>
      <div
        v-else-if="isOpen && loading"
        class="autocomplete-empty autocomplete-loading"
      >
        <span class="loading-dot" />
        <span class="loading-dot" />
        <span class="loading-dot" />
      </div>
    </Transition>

    <span v-if="error" class="input-error">{{ error }}</span>
    <span v-else-if="hint" class="input-hint">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts" generic="T">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'

interface Props {
  options?: T[]
  labelKey?: (keyof T & string) | (keyof T & string)[]
  labelSeparator?: string
  valueKey?: keyof T & string
  minChars?: number
  loading?: boolean
  emptyText?: string
  highlightMatch?: boolean
  type?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  isShowButton?: boolean
  buttonText?: string
  buttonPosition?: 'inside' | 'dropdown-top' | 'dropdown-bottom'
  error?: string
  hint?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [] as T[],
  minChars: 0,
  loading: false,
  emptyText: 'No results found',
  highlightMatch: true,
  type: 'text',
  label: '',
  labelSeparator: ' ',
  placeholder: '',
  disabled: false,
  isShowButton: true,
  buttonText: 'Добавить',
  buttonPosition: 'inside',
  readonly: false,
  required: false,
  error: '',
  hint: '',
  id: '',
})

const modelValue = defineModel<string>({ default: '' })

const emit = defineEmits<{
  select: [option: T]
  buttonHandler: [query: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  input: [event: Event]
  clear: []
}>()

const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const wrapperRef = useTemplateRef<HTMLDivElement>('wrapperRef')
const listRef = useTemplateRef<HTMLUListElement>('listRef')

const isOpen = ref(false)
const activeIndex = ref(-1)
const selectedOption = ref<T | null>(null)
const searchQuery = ref('')

const isFreeInputMode = computed(() => {
  if (!props.labelKey && !props.valueKey) return true
  if (props.labelKey && !props.valueKey) return true
  if (props.labelKey && props.valueKey && props.labelKey === props.valueKey)
    return true
  return false
})

const getOptionLabel = (opt: T): string => {
  if (typeof opt === 'string' || typeof opt === 'number') return String(opt)

  if (Array.isArray(props.labelKey)) {
    return props.labelKey
      .map((key) => (opt as Record<string, unknown>)[key])
      .filter((val) => val != null && val !== '')
      .join(props.labelSeparator)
  }

  const key =
    props.labelKey ?? (Object.keys(opt as object)[0] as keyof T & string)
  return String((opt as Record<string, unknown>)[key] ?? '')
}

const getOptionValue = (opt: T): string => {
  if (typeof opt === 'string' || typeof opt === 'number') return String(opt)
  const key =
    props.valueKey ?? (Object.keys(opt as object)[0] as keyof T & string)
  const val = (opt as Record<string, unknown>)[key]
  return val == null ? '' : String(val)
}

const highlight = (label: string): string => {
  if (!props.highlightMatch || !searchQuery.value.trim()) return label
  const escaped = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return label.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

const inputId = computed(
  () => props.id || `input-${Math.random().toString(36).slice(2, 9)}`
)

const filteredOptions = computed<T[]>(() => {
  if (!props.options || searchQuery.value.length < props.minChars) return []
  const q = searchQuery.value.toLowerCase().trim()
  return q
    ? props.options.filter((opt) =>
        getOptionLabel(opt).toLowerCase().includes(q)
      )
    : props.options
})

const showClear = computed(
  () => selectedOption.value !== null || searchQuery.value.length > 0
)

const canShowButton = computed(() => {
  if (!props.isShowButton) return false
  if (isFreeInputMode.value) return false
  return true
})

const showInsideButton = computed(
  () => canShowButton.value && props.buttonPosition === 'inside'
)

const showDropdownButton = computed(
  () =>
    canShowButton.value &&
    (props.buttonPosition === 'dropdown-top' ||
      props.buttonPosition === 'dropdown-bottom')
)

watch(
  modelValue,
  (val) => {
    if (isFreeInputMode.value) {
      searchQuery.value = String(val || '')
      return
    }
    if (!val) {
      searchQuery.value = ''
      selectedOption.value = null
      return
    }
    const found = props.options?.find(
      (opt) => String(getOptionValue(opt)) === String(val)
    )
    selectedOption.value = found ?? null
    searchQuery.value = found ? getOptionLabel(found) : ''
  },
  { immediate: true }
)

watch(searchQuery, (val) => {
  if (isFreeInputMode.value) modelValue.value = val
})

const openDropdown = () => {
  if (!props.disabled && !props.readonly) isOpen.value = true
}
const closeDropdown = () => {
  isOpen.value = false
  activeIndex.value = -1
}

const selectOption = (opt: T) => {
  selectedOption.value = opt
  searchQuery.value = getOptionLabel(opt)
  modelValue.value = getOptionValue(opt)
  emit('select', opt)
  closeDropdown()
}

const clearSelection = () => {
  selectedOption.value = null
  modelValue.value = ''
  searchQuery.value = ''
  openDropdown()
  inputRef.value?.focus()
  emit('clear')
}

const scrollActiveIntoView = () => {
  const item = listRef.value?.children[activeIndex.value] as
    | HTMLElement
    | undefined
  item?.scrollIntoView({ block: 'nearest' })
}

const handleKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) {
    if (e.key === 'ArrowDown' || e.key === 'Enter') openDropdown()
    return
  }
  const total = filteredOptions.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % total
    scrollActiveIntoView()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + total) % total
    scrollActiveIntoView()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (
      activeIndex.value >= 0 &&
      activeIndex.value < filteredOptions.value.length
    ) {
      selectOption(filteredOptions.value[activeIndex.value]!)
    }
  } else if (e.key === 'Escape') {
    closeDropdown()
  }
}

const handleInput = (event: Event) => {
  selectedOption.value = null
  searchQuery.value = (event.target as HTMLInputElement).value
  openDropdown()
  activeIndex.value = -1
  emit('input', event)
}

const handleCreate = () => {
  emit('buttonHandler', searchQuery.value)
  closeDropdown()
}
const handleFocus = (event: FocusEvent) => {
  openDropdown()
  emit('focus', event)
}
const handleBlur = (event: FocusEvent) => {
  setTimeout(closeDropdown, 150)
  emit('blur', event)
}

const onClickOutside = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node))
    closeDropdown()
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped>
.custom-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  position: relative;
}

.input-label {
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 500;
}

.input-required {
  color: var(--destructive);
  margin-left: 0.2rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-field {
  padding: 0.5rem 0.8rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  outline: none;
  font-size: 0.9rem;
  background-color: var(--foreground);
  cursor: text;
  transition: border-color 0.2s;
  height: 3rem;
  width: 100%;
  color: var(--text);
  font-family: inherit;
}

.input-field::placeholder {
  color: var(--muted-text);
}

.input-field:hover:not(:disabled):not(:read-only),
.input-field:focus {
  border-color: var(--accent);
}

.input-field:disabled,
.input-field:read-only {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: var(--muted-foreground);
}

.input-field--error,
.input-field--error:hover:not(:disabled):not(:read-only),
.input-field--error:focus {
  border-color: var(--destructive);
}

.input-field--with-prefix {
  padding-left: 2.5rem;
}
.input-field--with-suffix {
  padding-right: 2.5rem;
}
.input-field--with-create {
  padding-right: 5.8rem;
}

.input-prefix,
.input-suffix {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted-text);
  pointer-events: none;
}

.input-prefix {
  left: 0.86rem;
}
.input-suffix {
  right: 0.86rem;
}

.input-clear {
  pointer-events: all;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s;
}

.input-clear:hover {
  opacity: 1;
}

.input-field--with-clear-and-create {
  padding-right: 8.2rem;
}

.input-create-btn {
  position: absolute;
  height: calc(100% - 0.8rem);
  padding: 0 0.7rem;
  border: none;
  border-radius: calc(var(--border-radius) - 0.15rem);
  background-color: var(--accent);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition:
    opacity 0.15s,
    right 0.15s;
}

.input-clear--offset {
  right: 0.5rem;
}

.input-create-btn:hover {
  opacity: 0.85;
}

.autocomplete-list {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  z-index: 100;
  margin: 0;
  padding: 0.3rem;
  list-style: none;
  background-color: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-height: 14rem;
  overflow-y: auto;
  scrollbar-width: thin;
}

.autocomplete-item {
  padding: 0.5rem 0.7rem;
  border-radius: calc(var(--border-radius) - 0.1rem);
  font-size: 0.9rem;
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.12s;
  user-select: none;
}

.autocomplete-item:hover,
.autocomplete-item--active {
  background-color: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
}

.autocomplete-item__text :deep(mark) {
  background: none;
  color: var(--accent);
  font-weight: 600;
}

.autocomplete-item--create {
  color: var(--accent);
  font-weight: 500;
  border-bottom: 0.07rem solid var(--border-color);
}

/* для dropdown-bottom */
.autocomplete-item--create:last-child {
  border-bottom: none;
  border-top: 0.07rem solid var(--border-color);
}

.autocomplete-empty {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  z-index: 100;
  padding: 0.65rem 0.9rem;
  font-size: 0.8rem;
  color: var(--muted-text);
  background-color: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.autocomplete-loading {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.loading-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--muted-text);
  animation: pulse 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: scale(0.85);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.input-error {
  color: var(--destructive);
  font-size: 0.85rem;
}
.input-hint {
  color: var(--muted-text);
  font-size: 0.85rem;
}
</style>
