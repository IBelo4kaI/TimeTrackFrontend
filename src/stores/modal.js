import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUniversalModalStore = defineStore('universalModal', () => {
  // Состояние
  const show = ref(false)
  const title = ref('')
  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const isValid = ref(true)

  // Конфигурация кнопок
  const showSubmitButton = ref(true)
  const showDeleteButton = ref(false)
  const submitButtonText = ref('Сохранить')
  const deleteButtonText = ref('Удалить')
  const cancelButtonText = ref('Отмена')
  const submittingText = ref('Сохранение...')
  const deletingText = ref('Удаление...')

  // Конфигурация полей
  const fields = ref([])

  // Колбэки
  const onSubmit = ref(null)
  const onDelete = ref(null)
  const onClose = ref(null)
  const onValidate = ref(null)

  // Данные формы
  const formData = ref({})

  // Computed
  const isLoading = computed(() => isSubmitting.value || isDeleting.value)

  // Методы
  const open = (config = {}) => {
    title.value = config.title || ''

    showSubmitButton.value =
      config.showSubmitButton !== undefined ? config.showSubmitButton : true
    showDeleteButton.value = config.showDeleteButton || false

    submitButtonText.value = config.submitButtonText || 'Сохранить'
    deleteButtonText.value = config.deleteButtonText || 'Удалить'
    cancelButtonText.value = config.cancelButtonText || 'Отмена'
    submittingText.value = config.submittingText || 'Сохранение...'
    deletingText.value = config.deletingText || 'Удаление...'

    fields.value = config.fields || []

    onSubmit.value = config.onSubmit || null
    onDelete.value = config.onDelete || null
    onClose.value = config.onClose || null
    onValidate.value = config.onValidate || null

    // Инициализация formData со значениями по умолчанию
    formData.value = {}
    fields.value.forEach((field) => {
      formData.value[field.name] =
        field.value !== undefined ? field.value : null
    })

    show.value = true
  }

  const close = () => {
    if (isLoading.value) return

    if (onClose.value && typeof onClose.value === 'function') {
      onClose.value()
    }

    show.value = false

    // Сброс состояний
    setTimeout(() => {
      isSubmitting.value = false
      isDeleting.value = false
      formData.value = {}
      fields.value = []
    }, 300)
  }

  const submit = async () => {
    validateForm()

    if (!isValid.value || isLoading.value) return

    isSubmitting.value = true

    try {
      if (onSubmit.value && typeof onSubmit.value === 'function') {
        await onSubmit.value(formData.value)
      }
      // Закрываем модальное окно только после успешного выполнения
      isSubmitting.value = false
      close()
    } catch (error) {
      console.error('Ошибка при отправке:', error)
      isSubmitting.value = false
      // Не закрываем окно при ошибке
      throw error
    }
  }

  const deleteAction = async () => {
    if (isLoading.value) return

    isDeleting.value = true

    try {
      if (onDelete.value && typeof onDelete.value === 'function') {
        await onDelete.value(formData.value)
      }
      // Закрываем модальное окно только после успешного выполнения
      isDeleting.value = false
      close()
    } catch (error) {
      console.error('Ошибка при удалении:', error)
      isDeleting.value = false
      // Не закрываем окно при ошибке
      throw error
    }
  }

  const updateField = (name, value) => {
    formData.value[name] = value
    validateForm()
  }

  const validateForm = () => {
    let valid = true

    fields.value.forEach((field) => {
      field.error = null
      const value = formData.value[field.name]

      // required (как встроенный валидатор)
      if (field.required) {
        if (value === null || value === undefined || value === '') {
          field.error = 'Поле обязательно'
          valid = false
          return
        }
      }

      // кастомные валидаторы поля
      if (Array.isArray(field.validators)) {
        for (const validator of field.validators) {
          const error = validator(value, formData.value)
          if (error) {
            field.error = error
            valid = false
            break
          }
        }
      }
    })

    // глобальный валидатор формы (если нужен)
    if (onValidate.value && typeof onValidate.value === 'function') {
      const formError = onValidate.value(formData.value)
      if (typeof formError === 'string') {
        valid = false
      }
    }

    isValid.value = valid
  }

  return {
    // State
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

    // Actions
    open,
    close,
    submit,
    deleteAction,
    updateField,
    validateForm,
  }
})
