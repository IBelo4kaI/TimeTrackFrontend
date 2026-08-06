<template>
  <div class="vacation-form">
    <template v-if="isAdmin">
      <div class="field-wrapper">
        <label class="field-label">
          Пользователь
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
    </template>

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
        <span v-else>Добавить отпуск</span>
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import SelectUI from '@/components/SelectUI.vue'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { useNotificationStore } from '@/stores/notification'
import { createVacation } from '@/services/vacation.api'
import { existsFreeVacation, startDateBeforeEnd } from '@/utils/modal.utils'

const emit = defineEmits(['success'])

const userStore = useUserStore()
const vacationStore = useVacationStore()
const notificationStore = useNotificationStore()

const isAdmin = userStore.hasPermission('vacation.all', 'edit')

const formData = reactive({
  userId: userStore.user.id,
  status: 'pending',
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
  { value: 'rejected', label: 'Отклонено' },
  { value: 'pending', label: 'На рассмотрении' },
  { value: 'approved', label: 'Утверждено' },
]

const checkDateValidator = startDateBeforeEnd('startDate', 'endDate')
const checkFreeVacation = existsFreeVacation(vacationStore)

const validate = () => {
  let valid = true

  if (isAdmin && !formData.userId) {
    errors.userId = 'Поле обязательно'
    valid = false
  } else {
    errors.userId = null
  }

  if (!formData.startDate) {
    errors.startDate = 'Поле обязательно'
    valid = false
  } else {
    const dateErr = checkDateValidator(formData.startDate, formData)
    const freeErr = !isAdmin
      ? checkFreeVacation(formData.startDate, formData)
      : null
    errors.startDate = dateErr || freeErr || null
    if (errors.startDate) valid = false
  }

  if (!formData.endDate) {
    errors.endDate = 'Поле обязательно'
    valid = false
  } else {
    const dateErr = checkDateValidator(formData.endDate, formData)
    const freeErr = !isAdmin
      ? checkFreeVacation(formData.endDate, formData)
      : null
    errors.endDate = dateErr || freeErr || null
    if (errors.endDate) valid = false
  }

  return valid
}

const handleSubmit = async () => {
  if (!validate() || isLoading.value) return

  isSubmitting.value = true

  try {
    await createVacation({
      userId: formData.userId,
      status: formData.status,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      description: formData.description || undefined,
    })

    await vacationStore.fetchVacations()

    notificationStore.addNotification('Заявка на отпуск создана!', 'success')

    emit('success')
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    notificationStore.addNotification('Не удалось создать заявку', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.vacation-form {
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
