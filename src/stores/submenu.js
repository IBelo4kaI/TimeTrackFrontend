import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSubmenuStore = defineStore('submenu', () => {
  const activeTab = ref(null)
  const items = ref([])

  const setItems = (newItems) => {
    items.value = newItems
  }
  const setActiveTab = (newTab) => {
    activeTab.value = newTab
  }
  const reset = () => {
    activeTab.value = null
    items.value = []
  }

  return { activeTab, items, setItems, setActiveTab, reset }
})
