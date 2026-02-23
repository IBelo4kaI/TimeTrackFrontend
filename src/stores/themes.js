import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Возможные темы
  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system',
  }

  // Текущая тема
  const currentTheme = ref(THEMES.SYSTEM)

  // Инициализация темы из localStorage
  const initTheme = () => {
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      currentTheme.value = savedTheme
    }
    applyTheme()
  }

  // Применение темы
  const applyTheme = () => {
    let themeToApply = currentTheme.value

    // Если выбрана системная тема, определяем её
    if (themeToApply === THEMES.SYSTEM) {
      themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT
    }

    // Удаляем предыдущие классы тем
    document.documentElement.classList.remove('dark-theme')

    // Для тёмной темы добавляем класс dark-theme
    if (themeToApply === THEMES.DARK) {
      document.documentElement.classList.add('dark-theme')
    }
    // Для светлой темы ничего не делаем - это стандартная тема

    // Сохраняем в localStorage
    localStorage.setItem('app-theme', currentTheme.value)
  }

  // Установка темы
  const setTheme = (theme) => {
    if (Object.values(THEMES).includes(theme)) {
      currentTheme.value = theme
      applyTheme()
    }
  }

  // Переключение между светлой и тёмной темой
  const toggleTheme = () => {
    const effectiveTheme =
      currentTheme.value === THEMES.SYSTEM
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? THEMES.LIGHT
          : THEMES.DARK
        : currentTheme.value === THEMES.LIGHT
          ? THEMES.DARK
          : THEMES.LIGHT

    setTheme(effectiveTheme)
  }

  // Получение текущей применённой темы (учитывая системную)
  const getAppliedTheme = () => {
    if (currentTheme.value === THEMES.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT
    }
    return currentTheme.value
  }

  // Проверка, является ли текущая тема тёмной
  const isDark = () => {
    return getAppliedTheme() === THEMES.DARK
  }

  // Проверка, является ли текущая тема светлой
  const isLight = () => {
    return getAppliedTheme() === THEMES.LIGHT
  }

  // Слушатель изменения системной темы
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (currentTheme.value === THEMES.SYSTEM) {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Возвращаем функцию для очистки
    return () => mediaQuery.removeEventListener('change', handleChange)
  }

  // Инициализация при создании стора
  initTheme()

  // Настройка слушателя системной темы
  if (typeof window !== 'undefined') {
    setupSystemThemeListener()
  }

  return {
    // Константы
    THEMES,

    // Состояние
    currentTheme,

    // Методы
    setTheme,
    toggleTheme,
    getAppliedTheme,
    isDark,
    isLight,
    initTheme,
    applyTheme,
    setupSystemThemeListener,
  }
})
