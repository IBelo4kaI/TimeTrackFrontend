<template>
  <ModalLayout :title="title" @close="close" v-if="show">
    <div class="modal-fields">
      <div
        v-for="field in fields"
        :key="field.name"
        class="field-wrapper"
        :class="{ 'field-hidden': field.type === 'hidden' }"
      >
        <!-- Select -->
        <template v-if="field.type === 'select'">
          <label v-if="field.label" class="field-label">
            {{ field.label }}
            <span v-if="field.required" class="required">*</span>
          </label>
          <SelectUI
            v-model="formData[field.name]"
            :options="field.options"
            label-key="label"
            value-key="value"
            placeholder="Не выбрано"
            @change="updateField(field.name, $event)"
            :disabled="field.disabled || isLoading"
            :error="field.error != null"
          />
          <span v-if="field.error" class="error-message">
            {{ field.error }}
          </span>
          <span v-if="field.hint" class="field-hint">{{ field.hint }}</span>
        </template>

        <!-- Input (text, number, email, etc.) -->
        <template
          v-else-if="
            ['text', 'number', 'email', 'password', 'tel', 'url'].includes(
              field.type
            )
          "
        >
          <InputUi
            v-model="formData[field.name]"
            :type="field.type"
            :label="field.label"
            :required="field.required"
            :placeholder="field.placeholder"
            :disabled="field.disabled || isLoading"
            :error="field.error"
            :hint="field.hint"
            @input="updateField(field.name, $event.target.value)"
          />
        </template>

        <!-- Textarea -->
        <template v-else-if="field.type === 'textarea'">
          <label v-if="field.label" :for="field.name" class="field-label">
            {{ field.label }}
            <span v-if="field.required" class="required">*</span>
          </label>
          <textarea
            :id="field.name"
            :value="formData[field.name]"
            @input="updateField(field.name, $event.target.value)"
            :placeholder="field.placeholder"
            :disabled="field.disabled || isLoading"
            :rows="field.rows || 4"
            :class="{ 'field-error': field.error }"
          ></textarea>
          <span v-if="field.error" class="error-message">
            {{ field.error }}
          </span>
          <span v-if="field.hint" class="field-hint">{{ field.hint }}</span>
        </template>

        <!-- Checkbox -->
        <template v-else-if="field.type === 'checkbox'">
          <label class="checkbox-label">
            <input
              :id="field.name"
              type="checkbox"
              :checked="formData[field.name]"
              @change="updateField(field.name, $event.target.checked)"
              :disabled="field.disabled || isLoading"
            />
            <span>{{ field.label }}</span>
          </label>
          <span v-if="field.hint" class="field-hint">{{ field.hint }}</span>
        </template>

        <!-- Radio -->
        <template v-else-if="field.type === 'radio'">
          <label v-if="field.label" class="field-label">
            {{ field.label }}
            <span v-if="field.required" class="required">*</span>
          </label>
          <div class="radio-group">
            <label
              v-for="option in field.options"
              :key="option.value"
              class="radio-label"
            >
              <input
                type="radio"
                :name="field.name"
                :value="option.value"
                :checked="formData[field.name] === option.value"
                @change="updateField(field.name, option.value)"
                :disabled="field.disabled || isLoading"
              />
              <span>{{ option.label }}</span>
            </label>
          </div>
          <span v-if="field.hint" class="field-hint">{{ field.hint }}</span>
        </template>

        <!-- Info message -->
        <template v-else-if="field.type === 'info'">
          <p class="info-message" :class="field.className">
            {{ field.message || formData[field.name] }}
          </p>
        </template>

        <!-- Date -->
        <template v-else-if="field.type === 'date'">
          <InputUi
            v-model="formData[field.name]"
            type="date"
            :label="field.label"
            :required="field.required"
            :disabled="field.disabled || isLoading"
            :error="field.error"
            :hint="field.hint"
            @input="updateField(field.name, $event.target.value)"
          />
        </template>

        <!-- Custom Component -->
        <template v-else-if="field.type === 'component'">
          <label v-if="field.label" class="field-label">
            {{ field.label }}
            <span v-if="field.required" class="required">*</span>
          </label>
          <component
            :is="field.component"
            v-model="formData[field.name]"
            v-bind="field.props || {}"
            @update:modelValue="(value) => updateField(field.name, value)"
            @change="(value) => updateField(field.name, value)"
            @input="(value) => updateField(field.name, value)"
            :disabled="field.disabled || isLoading"
            :error="field.error"
          />
          <span v-if="field.error" class="error-message">
            {{ field.error }}
          </span>
          <span v-if="field.hint" class="field-hint">{{ field.hint }}</span>
        </template>
      </div>
    </div>

    <div class="modal-action">
      <ButtonUI
        v-if="showDeleteButton"
        type="destructive"
        @click="deleteAction"
        :disabled="isLoading"
      >
        <span v-if="isDeleting">{{ deletingText }}</span>
        <span v-else>{{ deleteButtonText }}</span>
      </ButtonUI>

      <div class="spacer"></div>

      <ButtonUI type="muted" @click="close" :disabled="isLoading">
        {{ cancelButtonText }}
      </ButtonUI>

      <ButtonUI
        v-if="showSubmitButton"
        :disabled="isLoading || !isValid"
        @click="submit"
      >
        <span v-if="isSubmitting">{{ submittingText }}</span>
        <span v-else>{{ submitButtonText }}</span>
      </ButtonUI>
    </div>
  </ModalLayout>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import ModalLayout from '@/layouts/ModalLayout.vue'
import InputUi from '@/components/InputUi.vue'
import { useUniversalModalStore } from '@/stores/modal'
import { storeToRefs } from 'pinia'
import SelectUI from './SelectUI.vue'

const modalStore = useUniversalModalStore()

const {
  show,
  title,
  isSubmitting,
  isDeleting,
  isValid,
  isLoading,
  showSubmitButton,
  showDeleteButton,
  submitButtonText,
  deleteButtonText,
  cancelButtonText,
  submittingText,
  deletingText,
  formData,
  fields,
} = storeToRefs(modalStore)

const { close, submit, deleteAction, updateField } = modalStore
</script>

<style scoped>
.modal-fields {
  display: flex;
  flex-direction: column;
  gap: 1.14rem;
}

.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.43rem;
}

.field-hidden {
  display: none;
}

.field-label {
  font-size: 0.93rem;
  font-weight: 500;
  color: var(--text-primary);
}

.required {
  color: var(--error-color, #ef4444);
}

textarea {
  padding: 0.57rem 0.86rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  outline: none;
  font-size: 1rem;
  background-color: var(--foreground);
  cursor: pointer;
  transition: border-color 0.2s;
  height: auto;
  resize: vertical;
  min-height: 80px;
}

textarea:hover:not(:disabled) {
  border-color: var(--accent);
}

textarea:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background-color: var(--muted-foreground);
}

.field-error {
  border-color: var(--destructive);
}

.error-message {
  font-size: 0.86rem;
  color: var(--destructive);
}

.field-hint {
  font-size: 0.86rem;
  color: var(--text);
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 0.57rem;
  cursor: pointer;
  font-size: 1rem;
}

.checkbox-label input[type='checkbox'],
.radio-label input[type='radio'] {
  width: auto;
  cursor: pointer;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.57rem;
}

.info-message {
  padding: 0.86rem;
  background-color: var(--muted-accent);
  border-radius: var(--border-radius);
  color: var(--text);
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.modal-action {
  display: flex;
  align-items: center;
  gap: 0.86rem;
  margin-top: 1.14rem;
}

.spacer {
  flex: 1;
}
</style>
