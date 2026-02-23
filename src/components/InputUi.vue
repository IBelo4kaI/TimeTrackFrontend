<template>
  <div class="custom-input">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <div class="input-wrapper">
      <span v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix"></slot>
      </span>
      <input
        :id="inputId"
        ref="inputRef"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :autocomplete="autocomplete"
        :class="[
          'input-field',
          { 'input-field--error': error },
          { 'input-field--with-prefix': $slots.prefix },
          { 'input-field--with-suffix': $slots.suffix },
        ]"
        @blur="handleBlur"
        @focus="handleFocus"
        @input="handleInput"
      />
      <span v-if="$slots.suffix" class="input-suffix">
        <slot name="suffix"></slot>
      </span>
    </div>
    <span v-if="error" class="input-error">{{ error }}</span>
    <span v-else-if="hint" class="input-hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed, useTemplateRef } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  autocomplete: {
    type: String,
    default: 'off',
  },
  id: {
    type: String,
    default: '',
  },
})

const model = defineModel()
const emit = defineEmits(['blur', 'focus', 'input'])

const inputRef = useTemplateRef('inputRef')

const inputId = computed(() => {
  return props.id || `input-${Math.random().toString(36).substring(2, 9)}`
})

const handleBlur = (event) => {
  emit('blur', event)
}

const handleFocus = (event) => {
  emit('focus', event)
}

const handleInput = (event) => {
  emit('input', event)
}

// Метод для программного фокуса
const focus = () => {
  inputRef.value?.focus()
}

// Экспортируем метод
defineExpose({
  focus,
})
</script>

<style scoped>
.custom-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.input-label {
  color: var(--text);
  font-size: 0.95rem;
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
  padding: 0.57rem 0.86rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  outline: none;
  font-size: 1rem;
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

.input-field:hover:not(:disabled):not(:read-only) {
  border-color: var(--accent);
}

.input-field:focus {
  border-color: var(--accent);
}

.input-field:disabled,
.input-field:read-only {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: var(--muted-foreground);
}

.input-field--error {
  border-color: var(--destructive);
}

.input-field--error:hover:not(:disabled):not(:read-only) {
  border-color: var(--destructive);
}

.input-field--error:focus {
  border-color: var(--destructive);
}

.input-field--with-prefix {
  padding-left: 2.5rem;
}

.input-field--with-suffix {
  padding-right: 2.5rem;
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

.input-error {
  color: var(--destructive);
  font-size: 0.85rem;
}

.input-hint {
  color: var(--muted-text);
  font-size: 0.85rem;
}
</style>
