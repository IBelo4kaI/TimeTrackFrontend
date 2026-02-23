import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useContextMenuStore = defineStore('context-menu', () => {
  const showMenu = ref(false)
  const x = ref(0)
  const y = ref(0)
  const contextElement = ref(null)
  const contextItems = ref([])
  const contextData = ref(null)
  const actionHandler = ref(null)

  const setPosition = (xU, yU) => {
    x.value = xU
    y.value = yU
  }

  const setContextRef = (contextRef) => {
    contextElement.value = contextRef.value

    const maxLeftValue =
      window.innerWidth - 20 - contextElement.value.offsetWidth
    const maxTopValue =
      window.innerHeight - 20 - contextElement.value.offsetHeight

    setPosition(Math.min(maxLeftValue, x.value), Math.min(maxTopValue, y.value))
  }

  const contextClose = () => {
    showMenu.value = false
    contextData.value = null
    actionHandler.value = null
    document.removeEventListener('click', contextClose)
  }

  const openMenu = (event, options = {}) => {
    const {
      items = [],
      data = null,
      onAction = null,
      beforeOpen = null,
    } = options

    // Вызов callback перед открытием (для дополнительной логики)
    if (beforeOpen && !beforeOpen(data)) {
      return
    }

    showMenu.value = true
    contextItems.value = items
    contextData.value = data
    actionHandler.value = onAction

    setPosition(event.clientX, event.clientY)

    document.addEventListener('click', contextClose)
  }

  const handleAction = (action) => {
    if (actionHandler.value) {
      actionHandler.value(action, contextData.value)
    }
    contextClose()
  }

  return {
    openMenu,
    setContextRef,
    contextClose,
    setPosition,
    handleAction,

    contextElement,
    contextItems,
    contextData,
    showMenu,
    x,
    y,
  }
})
