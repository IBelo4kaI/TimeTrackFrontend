<template>
  <div class="vacation-form">
    <div class="vacation-form__title">Создание заявки</div>
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
          full-width
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
          full-width
          style="width: 100%"
        />
      </div>
    </template>

    <div class="field-wrapper">
      <label class="field-label">
        Тип отпуска
        <span class="required">*</span>
      </label>
      <SelectUI
        v-model="formData.vacationTypeId"
        :options="vacationTypeOptions"
        label-key="label"
        value-key="value"
        placeholder="Не выбрано"
        :disabled="isLoading || vacationTypeOptions.length === 0"
        :error="errors.vacationTypeId != null"
        full-width
        style="width: 100%"
      />
      <span v-if="errors.vacationTypeId" class="error-message">
        {{ errors.vacationTypeId }}
      </span>
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

    <div class="end-mode-group">
      <Tabs :tabs="endModeTabs" v-model="endMode" type="line" />

      <div class="end-mode-panel">
        <div class="field-wrapper" v-if="endMode === 'date'">
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

        <div class="field-wrapper" v-else>
          <InputUi
            v-model="daysInput"
            type="number"
            label="Количество дней отпуска"
            :required="true"
            :disabled="isLoading"
            :error="errors.endDate"
            @input="errors.endDate = null"
          />
        </div>

        <div class="days-count" v-if="endMode === 'date' && daysCount !== null">
          Продолжительность: {{ formatStats(daysCount) }}
        </div>
        <div class="days-count" v-else-if="endMode === 'days' && formData.endDate">
          Дата окончания: {{ new Date(formData.endDate).toLocaleDateString('ru-RU') }}
        </div>
      </div>
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
import { reactive, computed, onMounted, ref, watch } from 'vue'
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { useNotificationStore } from '@/stores/notification'
import {
  calculateVacationDays,
  calculateVacationEndDate,
  createVacation,
} from '@/services/vacation.api'
import { getActiveVacationTypes } from '@/services/vacationTypes.api'
import { existsFreeVacation, startDateBeforeEnd } from '@/utils/modal.utils'
import { getUserFullName } from '@/utils/user.utils'
import { formatStats } from '@/utils/vacation.utils'

const emit = defineEmits(['success'])

const userStore = useUserStore()
const vacationStore = useVacationStore()
const notificationStore = useNotificationStore()

const isAdmin = userStore.hasPermission('vacation.all', 'edit')

const formData = reactive({
  userId: userStore.user.id,
  status: 'pending',
  vacationTypeId: '',
  startDate: '',
  endDate: '',
  description: '',
})

const errors = reactive({
  userId: null,
  vacationTypeId: null,
  startDate: null,
  endDate: null,
})

// --- типы отпусков ---

const vacationTypes = ref([])

const vacationTypeOptions = computed(() =>
  vacationTypes.value.map((t) => ({ value: t.id, label: t.name }))
)

onMounted(async () => {
  try {
    vacationTypes.value = (await getActiveVacationTypes()) ?? []
  } catch {
    vacationTypes.value = []
  }

  // По умолчанию выбираем системный "основной оплачиваемый" тип, если он
  // есть, иначе — первый в списке. Пользователь может сразу поменять.
  if (!formData.vacationTypeId && vacationTypes.value.length > 0) {
    const defaultType =
      vacationTypes.value.find((t) => t.systemName === 'paid') ??
      vacationTypes.value[0]
    formData.vacationTypeId = defaultType.id
  }
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

// Дата окончания задаётся либо явно, либо через количество дней — во втором
// случае бэк сам подбирает дату (GET /vacation/calculate-end), раздвигая
// период на праздничные дни, и мы просто подставляем её в formData.endDate.
const endMode = ref('date')
const daysInput = ref('')

const endModeTabs = [
  { id: 'date', label: 'Дата окончания' },
  { id: 'days', label: 'Количество дней' },
]

// Считаем на бэке (GET /vacation/calculate), а не локально: праздничные дни
// внутри периода не входят в totalVacationDays (см. affects_vacation у
// calendar_events), простым end-start+1 это не посчитать.
const daysCount = ref(null)

watch(
  () => [formData.startDate, formData.endDate, endMode.value],
  async ([start, end, mode]) => {
    if (mode !== 'date') return
    if (!start || !end || new Date(end) < new Date(start)) {
      daysCount.value = null
      return
    }

    try {
      const result = await calculateVacationDays(start, end)
      daysCount.value = result?.totalVacationDays ?? null
    } catch {
      daysCount.value = null
    }
  }
)

watch(
  () => [formData.startDate, daysInput.value, endMode.value],
  async ([start, days, mode]) => {
    if (mode !== 'days' || !start || !days || Number(days) < 1) return

    try {
      const result = await calculateVacationEndDate(start, Number(days))
      if (result?.endDate) {
        // ISO-строка с бэка ("2025-08-15T00:00:00Z") → формат <input type="date">
        formData.endDate = result.endDate.slice(0, 10)
      }
    } catch {
      // не критично — при сабмите сработает валидация на пустую/старую дату
    }
  }
)

// При переключении режима старое значение из другого режима не должно
// мешать валидации того, в который перешли.
watch(endMode, () => {
  errors.endDate = null
})

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

  if (!formData.vacationTypeId) {
    errors.vacationTypeId = 'Поле обязательно'
    valid = false
  } else {
    errors.vacationTypeId = null
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

  if (endMode.value === 'days' && (!daysInput.value || Number(daysInput.value) < 1)) {
    errors.endDate = 'Укажите количество дней'
    valid = false
  } else if (!formData.endDate) {
    errors.endDate =
      endMode.value === 'days'
        ? 'Идёт расчёт даты окончания, подождите'
        : 'Поле обязательно'
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
    const selfName = [
      userStore.user?.surname,
      userStore.user?.name,
      userStore.user?.patronymic,
    ]
      .filter(Boolean)
      .join(' ')

    await createVacation({
      userId: formData.userId,
      status: formData.status,
      vacationTypeId: formData.vacationTypeId,
      applicantName:
        formData.userId === userStore.user.id
          ? selfName
          : getUserFullName(userStore.usersAll, formData.userId),
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

.vacation-form__title {
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

.days-count {
  font-size: 0.86rem;
  font-weight: 500;
  color: var(--accent);
}

/* Таб + панель под ним — один визуальный блок: без зазора между ними и без
   скругления в месте стыка, чтобы панель читалась как продолжение таба. */
.end-mode-group {
  display: flex;
  flex-direction: column;
}

.end-mode-panel {
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
  background: var(--background);
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  padding: var(--padding-secondary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.57rem;
}

@media (max-width: 768px) {
  .vacation-form {
    min-width: 0;
    max-width: none;
    width: 100%;
  }
}
</style>
