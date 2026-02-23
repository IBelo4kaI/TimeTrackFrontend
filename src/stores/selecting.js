import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSelectingStore = defineStore('selecting', () => {
  const isSelecting = ref(false)
  const selectedItems = ref(new Set()) // Set для уникальных элементов
  const selectionStart = ref(null) // Начальная точка выделения
  const lastSelected = ref(null) // Последний выбранный элемент для Shift
  const isDragging = ref(false) // Флаг перетаскивания

  // Опции для кастомизации поведения
  const options = ref({
    itemsGetter: null, // Функция для получения всех доступных элементов
    itemValidator: null, // Функция для проверки, можно ли выбрать элемент
    itemComparator: null, // Функция для сравнения элементов (для Set)
    rangeSelector: null, // Функция для выбора диапазона элементов
  })

  // Настройка store с пользовательскими опциями
  const configure = (config = {}) => {
    options.value = {
      itemsGetter: config.itemsGetter || (() => []),
      itemValidator: config.itemValidator || (() => true),
      itemComparator: config.itemComparator || ((a, b) => a === b),
      rangeSelector: config.rangeSelector || defaultRangeSelector,
    }
  }

  // Дефолтная функция выбора диапазона (по индексам)
  const defaultRangeSelector = (startItem, endItem) => {
    const allItems = options.value.itemsGetter()
    const startIndex = allItems.findIndex((item) =>
      options.value.itemComparator(item, startItem)
    )
    const endIndex = allItems.findIndex((item) =>
      options.value.itemComparator(item, endItem)
    )

    if (startIndex === -1 || endIndex === -1) return []

    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)

    return allItems.slice(start, end + 1)
  }

  // Проверка, выбран ли элемент
  const isItemSelected = (item) => {
    if (!item) return false
    return Array.from(selectedItems.value).some((selected) =>
      options.value.itemComparator(selected, item)
    )
  }

  // Количество выбранных элементов
  const selectedCount = computed(() => selectedItems.value.size)

  // Массив выбранных элементов
  const selectedArray = computed(() => Array.from(selectedItems.value))

  // Начало выделения (клик или начало drag)
  const startSelection = (item, withShift = false, withCtrl = false) => {
    if (!item || !options.value.itemValidator(item)) return

    if (withShift && lastSelected.value) {
      // Выделение диапазона с Shift
      selectRange(lastSelected.value, item)
    } else if (withCtrl) {
      // Добавление/удаление с Ctrl (множественный выбор)
      toggleItem(item)
    } else {
      // Одиночный выбор или начало drag
      if (isItemSelected(item)) {
        removeItem(item)
      } else {
        // Очищаем предыдущее выделение при одиночном клике
        selectedItems.value.clear()
        selectedItems.value.add(item)
      }
      selectionStart.value = item
      lastSelected.value = item
    }
  }

  // Добавление/удаление элемента
  const toggleItem = (item) => {
    if (!item || !options.value.itemValidator(item)) return

    if (isItemSelected(item)) {
      removeItem(item)
    } else {
      selectedItems.value.add(item)
      lastSelected.value = item
    }
  }

  // Добавление элемента
  const addItem = (item) => {
    if (!item || !options.value.itemValidator(item)) return
    selectedItems.value.add(item)
    lastSelected.value = item
  }

  // Удаление элемента
  const removeItem = (item) => {
    if (!item) return
    const itemToRemove = Array.from(selectedItems.value).find((selected) =>
      options.value.itemComparator(selected, item)
    )
    if (itemToRemove) {
      selectedItems.value.delete(itemToRemove)
    }
  }

  // Начало перетаскивания
  const startDragSelection = (item) => {
    if (!item || !options.value.itemValidator(item)) return

    isSelecting.value = true
    isDragging.value = true
    selectionStart.value = item
    lastSelected.value = item

    // При начале перетаскивания очищаем предыдущее выделение
    selectedItems.value.clear()
    selectedItems.value.add(item)
  }

  // Обновление выделения при перетаскивании
  const updateDragSelection = (item) => {
    if (!isDragging.value || !item || !options.value.itemValidator(item)) return

    // Выделяем диапазон от начальной точки до текущей
    if (selectionStart.value) {
      selectRange(selectionStart.value, item)
    }
  }

  // Выделение диапазона между двумя элементами
  const selectRange = (startItem, endItem) => {
    if (!startItem || !endItem) return

    const rangeItems = options.value.rangeSelector(startItem, endItem)

    // Очищаем текущее выделение
    selectedItems.value.clear()

    // Добавляем все элементы в диапазоне
    rangeItems.forEach((item) => {
      if (options.value.itemValidator(item)) {
        selectedItems.value.add(item)
      }
    })

    // Обновляем последний выбранный
    lastSelected.value = endItem
  }

  // Окончание выделения
  const endSelection = () => {
    if (isDragging.value) {
      isDragging.value = false
      isSelecting.value = false
    }
  }

  // Очистка выделения
  const clearSelection = () => {
    selectedItems.value.clear()
    selectionStart.value = null
    lastSelected.value = null
  }

  // Выбрать все элементы
  const selectAll = () => {
    const allItems = options.value.itemsGetter()
    selectedItems.value.clear()
    allItems.forEach((item) => {
      if (options.value.itemValidator(item)) {
        selectedItems.value.add(item)
      }
    })
  }

  // Инвертировать выделение
  const invertSelection = () => {
    const allItems = options.value.itemsGetter()
    const newSelection = new Set()

    allItems.forEach((item) => {
      if (options.value.itemValidator(item) && !isItemSelected(item)) {
        newSelection.add(item)
      }
    })

    selectedItems.value = newSelection
  }

  return {
    // State
    selectedItems,
    isSelecting,
    isDragging,
    selectionStart,
    lastSelected,

    // Computed
    selectedCount,
    selectedArray,

    // Configuration
    configure,

    // Getters
    isItemSelected,

    // Actions
    startSelection,
    toggleItem,
    addItem,
    removeItem,
    startDragSelection,
    updateDragSelection,
    endSelection,
    clearSelection,
    selectRange,
    selectAll,
    invertSelection,
  }
})
