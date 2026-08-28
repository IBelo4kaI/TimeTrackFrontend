<template>
  <div class="sick-leave-form">
    <div class="sick-leave-form__title">Добавить больничный</div>
    <template v-if="isAdmin">
      <div class="field-wrapper">
        <label class="field-label">
          Сотрудник
          <span class="required">*</span>
        </label>
        <SelectUI
          v-model="formData.userId"
          :options="userOptions"
          label-key="label"
          value-key="value"
          placeholder="Не выбрано"
          :disabled="isLoading"
          :error="errors.userId != null"
          style="width: 100%"
        />
        <span v-if="errors.userId" class="error-message">
          {{ errors.userId }}
        </span>
      </div>
    </template>

    <div class="field-wrapper">
      <label class="field-label">
        Статус
        <span class="required">*</span>
      </label>
      <SelectUI
        v-model="formData.status"
        :options="statusOptions"
        label-key="label"
        value-key="value"
        placeholder="Не выбрано"
        :disabled="isLoading"
        style="width: 100%"
      />
    </div>

    <div class="field-wrapper">
      <InputUi
        v-model="formData.startDate"
        type="date"
        label="Дата начала"
        :required="true"
        :disabled="isLoading"
        :error="errors.startDate"
        @input="errors.startDate = null"
      />
    </div>

    <div class="field-wrapper">
      <InputUi
        v-model="formData.endDate"
        type="date"
        label="Дата окончания"
        :required="true"
        :disabled="isLoading"
        :error="errors.endDate"
        @input="errors.endDate = null"
      />
    </div>

    <div class="field-wrapper">
      <InputUi
        v-model="formData.description"
        type="text"
        label="Описание"
        :disabled="isLoading"
      />
    </div>

    <div class="form-actions">
      <ButtonUI :disabled="isLoading" @click="handleSubmit">
        <span v-if="isSubmitting">Сохранение...</span>
        <span v-else>Добавить больничный</span>
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import SelectUI from '@/components/SelectUI.vue'
import { createSickLeave } from '@/services/sick_leave.api'
import { useNotificationStore } from '@/stores/notification'
import { useSickLeaveStore } from '@/stores/sick_leave'
import { useUserStore } from '@/stores/user'
import { startDateBeforeEnd } from '@/utils/modal.utils'
import { getUserFullName } from '@/utils/user.utils'
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  isAdmin: { type: Boolean, default: false },
})

const emit = defineEmits(['success'])

const userStore = useUserStore()
const sickLeaveStore = useSickLeaveStore()
const notificationStore = useNotificationStore()

const formData = reactive({
  userId: userStore.user.id,
  status: 'unofficial',
  startDate: '',
  endDate: '',
  description: '',
})

const errors = reactive({
  userId: null,
  startDate: null,
  endDate: null,
})

const isSubmitting = ref(false)
const isLoading = computed(() => isSubmitting.value)

const userOptions = computed(() =>
  userStore.usersAll.map((u) => ({
    value: u.id,
    label: [u.name, u.surname].filter(Boolean).join(' '),
  }))
)

const statusOptions = [
  { value: 'unofficial', label: 'Неофициальный' },
  { value: 'official', label: 'Официальный' },
]

const checkDateValidator = startDateBeforeEnd('startDate', 'endDate')

const validate = () => {
  let valid = true

  if (props.isAdmin && !formData.userId) {
    errors.userId = 'Поле обязательно'
    valid = false
  } else {
    errors.userId = null
  }

  if (!formData.startDate) {
    errors.startDate = 'Поле обязательно'
    valid = false
  } else {
    errors.startDate = checkDateValidator(formData.startDate, formData)
    if (errors.startDate) valid = false
  }

  if (!formData.endDate) {
    errors.endDate = 'Поле обязательно'
    valid = false
  } else {
    errors.endDate = checkDateValidator(formData.endDate, formData)
    if (errors.endDate) valid = false
  }

  return valid
}

const handleSubmit = async () => {
  if (!validate() || isLoading.value) return

  isSubmitting.value = true

  try {
    const selfName = [
      userStore.user?.surname,
      userStore.user?.name,
      userStore.user?.patronymic,
    ]
      .filter(Boolean)
      .join(' ')

    await createSickLeave({
      userId: formData.userId,
      status: formData.status,
      applicantName:
        formData.userId === userStore.user.id
          ? selfName
          : getUserFullName(userStore.usersAll, formData.userId),
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      description: formData.description || undefined,
    })

    await sickLeaveStore.fetchSickLeaves()

    notificationStore.addNotification('Больничный добавлен', 'success')

    formData.status = 'unofficial'
    formData.startDate = ''
    formData.endDate = ''
    formData.description = ''

    emit('success')
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    notificationStore.addNotification('Не удалось добавить больничный', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.sick-leave-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);

  min-width: 20rem;
  max-width: 30rem;
}

.sick-leave-form__title {
  font-size: 1.2rem;
  font-weight: 600;
}

.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.43rem;
}

.field-label {
  font-size: 0.93rem;
  font-weight: 500;
  color: var(--text-primary);
}

.required {
  color: var(--error-color, #ef4444);
}

.error-message {
  font-size: 0.86rem;
  color: var(--destructive);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.57rem;
}
</style>
