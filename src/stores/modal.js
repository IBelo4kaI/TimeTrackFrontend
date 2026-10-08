import { defineStore } from 'pinia'
import { ref, computed, markRaw } from 'vue'

export const useUniversalModalStore = defineStore('universalModal', () => {
  // Состояние
  const show = ref(false)
  const title = ref('')
  const width = ref('')
  const isSubmitting = ref(false)
  const isDeleting = ref(false)
  const isValid = ref(true)
  const formError = ref('')

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

  // Окна, открытые поверх другого, и счётчик открытий для отложенной очистки
  const stack = []
  let generation = 0
  let resetTimer = null

  const snapshot = () => ({
    title: title.value,
    width: width.value,
    showSubmitButton: showSubmitButton.value,
    showDeleteButton: showDeleteButton.value,
    submitButtonText: submitButtonText.value,
    deleteButtonText: deleteButtonText.value,
    cancelButtonText: cancelButtonText.value,
    submittingText: submittingText.value,
    deletingText: deletingText.value,
    fields: fields.value,
    formData: formData.value,
    onSubmit: onSubmit.value,
    onDelete: onDelete.value,
    onClose: onClose.value,
    onValidate: onValidate.value,
  })

  const restore = (s) => {
    title.value = s.title
    width.value = s.width
    showSubmitButton.value = s.showSubmitButton
    showDeleteButton.value = s.showDeleteButton
    submitButtonText.value = s.submitButtonText
    deleteButtonText.value = s.deleteButtonText
    cancelButtonText.value = s.cancelButtonText
    submittingText.value = s.submittingText
    deletingText.value = s.deletingText
    fields.value = s.fields
    formData.value = s.formData
    onSubmit.value = s.onSubmit
    onDelete.value = s.onDelete
    onClose.value = s.onClose
    onValidate.value = s.onValidate
    isSubmitting.value = false
    isDeleting.value = false
    isValid.value = true
    formError.value = ''
  }

  // Методы
  const open = (config = {}) => {
    clearTimeout(resetTimer)
    generation++
    // Окно, открытое из onSubmit/onDelete, заменяет текущее, а не накладывается
    if (show.value && !isLoading.value) stack.push(snapshot())
    formError.value = ''
    isValid.value = true

    title.value = config.title || ''
    width.value = config.width || ''

    showSubmitButton.value =
      config.showSubmitButton !== undefined ? config.showSubmitButton : true
    showDeleteButton.value = config.showDeleteButton || false

    submitButtonText.value = config.submitButtonText || 'Сохранить'
    deleteButtonText.value = config.deleteButtonText || 'Удалить'
    cancelButtonText.value = config.cancelButtonText || 'Отмена'
    submittingText.value = config.submittingText || 'Сохранение...'
    deletingText.value = config.deletingText || 'Удаление...'

    // markRaw на field.component ОБЯЗАТЕЛЕН: fields — реактивный ref, и без
    // markRaw само определение компонента (обычный объект с setup/render)
    // попадает под реактивный Proxy. Vue предупреждает об этом в доках не
    // просто так — на практике это иногда приводит к тому, что <component
    // :is="field.component"> считает объект "новым" между рендерами и
    // пересоздаёт инстанс не вовремя, теряя обработчики кликов у всего, что
    // внутри (в этом чате — у полей формы и у кнопок модалки заодно).
    fields.value = (config.fields || []).map((field) =>
      field.type === 'component' && field.component
        ? { ...field, component: markRaw(field.component) }
        : field
    )

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

    const previous = stack.pop()
    if (previous) {
      restore(previous)
      return
    }

    show.value = false

    // Сброс после анимации; отменяется, если окно открыли заново
    resetTimer = setTimeout(() => {
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
    const gen = generation

    try {
      if (onSubmit.value && typeof onSubmit.value === 'function') {
        await onSubmit.value(formData.value)
      }
    } catch (error) {
      // Окно остаётся открытым, сообщение показывает сам onSubmit
      console.error('Ошибка при отправке:', error)
      isSubmitting.value = false
      return
    }
    isSubmitting.value = false
    // Если onSubmit открыл следующее окно, закрывать нечего
    if (gen === generation) close()
  }

  const deleteAction = async () => {
    if (isLoading.value) return

    isDeleting.value = true
    const gen = generation

    try {
      if (onDelete.value && typeof onDelete.value === 'function') {
        await onDelete.value(formData.value)
      }
    } catch (error) {
      console.error('Ошибка при удалении:', error)
      isDeleting.value = false
      return
    }
    isDeleting.value = false
    if (gen === generation) close()
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
    formError.value = ''
    if (onValidate.value && typeof onValidate.value === 'function') {
      const error = onValidate.value(formData.value)
      if (typeof error === 'string') {
        formError.value = error
        valid = false
      }
    }

    isValid.value = valid
  }

  return {
    // State
    show,
    title,
    width,
    isSubmitting,
    isDeleting,
    isValid,
    formError,
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
