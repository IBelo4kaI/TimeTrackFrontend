import {
  calculateVacationDays,
  calculateVacationEndDate,
  createVacation,
  getVacationStats,
} from '@/services/vacation.api'
import { getActiveVacationTypes } from '@/services/vacationTypes.api'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { startDateBeforeEnd } from '@/utils/modal.utils'
import { computed, onMounted, reactive, ref, watch } from 'vue'

// Состояние и логика формы создания отпуска для пошаговой страницы
// (pages/vacation/VacationCreateStepsPage.vue). Классическая форма
// (components/Vacation/VacationCreate.vue) живёт своей логикой отдельно.
export function useVacationForm() {
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

  onMounted(async () => {
    try {
      vacationTypes.value = (await getActiveVacationTypes()) ?? []
    } catch {
      vacationTypes.value = []
    }

    // По умолчанию — системный "основной оплачиваемый", иначе первый в списке
    if (!formData.vacationTypeId && vacationTypes.value.length > 0) {
      const defaultType =
        vacationTypes.value.find((t) => t.systemName === 'paid') ??
        vacationTypes.value[0]
      formData.vacationTypeId = defaultType.id
    }
  })

  const selectedType = computed(
    () => vacationTypes.value.find((t) => t.id === formData.vacationTypeId) ?? null
  )

  const employee = computed(
    () => userStore.usersAll.find((u) => u.id === formData.userId) ?? null
  )

  const employeeName = computed(() => {
    const e = employee.value ?? userStore.user
    return [e?.surname, e?.name, e?.patronymic].filter(Boolean).join(' ')
  })

  const statusOptions = [
    { value: 'pending', label: 'На рассмотрении' },
    { value: 'approved', label: 'Утверждено' },
    { value: 'rejected', label: 'Отклонено' },
  ]

  // --- окончание ⇄ количество дней ---
  // В режиме "дата" число дней считает бэк по датам (без праздников) и
  // подставляется в поле дней; в режиме "дни" окончание считается по числу.
  // Счётчик увеличивается до проверки режима — ответ запроса из режима, который
  // уже сменился, ничего не перезаписывает.

  const endMode = ref('date')
  const daysInput = ref('')
  const daysCount = ref(null)

  let daysSeq = 0

  watch(
    () => [formData.startDate, formData.endDate, endMode.value],
    async ([start, end, mode]) => {
      const seq = ++daysSeq
      if (mode !== 'date') return

      if (!start || !end || new Date(end) < new Date(start)) {
        daysCount.value = null
        daysInput.value = ''
        return
      }

      try {
        const result = await calculateVacationDays(start, end)
        if (seq !== daysSeq) return
        daysCount.value = result?.totalVacationDays ?? null
        daysInput.value = daysCount.value != null ? String(daysCount.value) : ''
      } catch {
        if (seq === daysSeq) daysCount.value = null
      }
    }
  )

  let endDateSeq = 0

  watch(
    () => [formData.startDate, daysInput.value, endMode.value],
    async ([start, days, mode]) => {
      const seq = ++endDateSeq
      if (mode !== 'days') return

      if (!days || Number(days) < 1) {
        formData.endDate = ''
        return
      }
      if (!start) return

      try {
        const result = await calculateVacationEndDate(start, Number(days))
        if (seq === endDateSeq && result?.endDate) {
          formData.endDate = result.endDate.slice(0, 10)
        }
      } catch {
        // не критично — при проверке шага сработает валидация на пустую дату
      }
    }
  )

  // Сколько дней в отпуске сейчас
  const currentDays = computed(() =>
    endMode.value === 'days' ? Number(daysInput.value) || null : daysCount.value
  )

  // --- остаток отпускных дней за год начала отпуска ---

  const freeDays = ref(null)
  let freeSeq = 0

  watch(
    () => [formData.startDate, formData.userId],
    async ([start, userId]) => {
      freeDays.value = null
      if (!start || !userId) return

      const seq = ++freeSeq
      try {
        const stats = await getVacationStats(new Date(start).getFullYear(), userId)
        if (seq === freeSeq) freeDays.value = stats?.free ?? null
      } catch {
        // без остатка проверку и подсказки пропускаем
      }
    }
  )

  // Сколько дней останется после отпуска (тип без списания из баланса не тратит)
  const freeAfter = computed(() => {
    if (freeDays.value == null) return null
    if (selectedType.value && !selectedType.value.affectsBalance) return freeDays.value
    return freeDays.value - (currentDays.value ?? 0)
  })

  const checkDateValidator = startDateBeforeEnd('startDate', 'endDate')

  // --- выбор дат снаружи (календарь) ---

  function setDates({ startDate, endDate }) {
    formData.startDate = startDate
    formData.endDate = endDate
    errors.startDate = null
    errors.endDate = null
    endMode.value = 'date'
  }

  // --- проверки шагов ---

  function validateWho() {
    let valid = true

    if (isAdmin && !formData.userId) {
      errors.userId = 'Выберите сотрудника'
      valid = false
    } else {
      errors.userId = null
    }

    if (!formData.vacationTypeId) {
      errors.vacationTypeId = 'Выберите тип отпуска'
      valid = false
    } else {
      errors.vacationTypeId = null
    }

    return valid
  }

  function validatePeriod() {
    let valid = true

    if (!formData.startDate) {
      errors.startDate = 'Укажите дату начала'
      valid = false
    } else {
      errors.startDate = null
    }

    if (endMode.value === 'days' && (!daysInput.value || Number(daysInput.value) < 1)) {
      errors.endDate = 'Укажите количество дней'
      valid = false
    } else if (!formData.endDate) {
      errors.endDate =
        endMode.value === 'days'
          ? 'Идёт расчёт даты окончания, подождите'
          : 'Укажите дату окончания'
      valid = false
    } else {
      const dateErr = checkDateValidator(formData.endDate, formData)
      const need = currentDays.value
      // Лимит остатка блокирует обычного сотрудника и только для типов со списанием
      const overLimit =
        !isAdmin &&
        need &&
        freeDays.value != null &&
        (selectedType.value?.affectsBalance ?? true) &&
        freeDays.value < need
      errors.endDate =
        dateErr ||
        (overLimit
          ? `Не хватает свободных отпускных дней: ${need} / ${freeDays.value}`
          : null)
      if (errors.endDate) valid = false
    }

    return valid
  }

  // --- отправка ---

  const isSubmitting = ref(false)

  async function submit() {
    if (isSubmitting.value) return false
    isSubmitting.value = true

    try {
      await createVacation({
        userId: formData.userId,
        status: formData.status,
        vacationTypeId: formData.vacationTypeId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        description: formData.description || undefined,
      })

      await vacationStore.fetchVacations()
      notificationStore.addNotification('Заявка на отпуск создана!', 'success')
      return true
    } catch (error) {
      console.error('Ошибка при сохранении:', error)
      notificationStore.addNotification(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Не удалось создать заявку',
        'error'
      )
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Что-то уже введено — для подтверждения при уходе со страницы
  const isDirty = computed(
    () => !!(formData.startDate || formData.endDate || formData.description)
  )

  return {
    isAdmin,
    formData,
    errors,
    vacationTypes,
    selectedType,
    employeeName,
    statusOptions,
    endMode,
    daysInput,
    daysCount,
    currentDays,
    freeDays,
    freeAfter,
    isSubmitting,
    isDirty,
    setDates,
    validateWho,
    validatePeriod,
    submit,
  }
}
