import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHolidayDecorationsStore = defineStore('holiday-decorations', () => {
  const enabled = ref(true)
  try {
    enabled.value = localStorage.getItem('holiday-decorations') !== 'false'
  } catch { /* Настройка остаётся доступна без хранилища браузера. */ }

  function toggle() {
    enabled.value = !enabled.value
    try {
      localStorage.setItem('holiday-decorations', String(enabled.value))
    } catch { /* Сохраняем выбор в текущем сеансе. */ }
  }

  return { enabled, toggle }
})
