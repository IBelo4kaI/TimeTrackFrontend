import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  let idCounter = 0

  const addNotification = (message, type = 'info', duration = 4000) => {
    const id = idCounter++
    notifications.value.push({
      id,
      message,
      type,
      duration,
      createdAt: Date.now(),
    })
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const items = ref([])
  const isLoading = ref(false)

  const unreadCount = computed(
    () => items.value.filter((n) => !n.isRead).length
  )

  async function fetchNotifications() {
    isLoading.value = true
    try {
      // const data = await fetchNotifications()
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function markRead(id) {
    await markNotificationRead(id)
    const item = items.value.find((n) => n.id === id)
    if (item) item.isRead = true
  }

  async function markAllRead() {
    await markAllNotificationsRead()
    items.value.forEach((n) => (n.isRead = true))
  }

  function addFromWS(notification) {
    items.value.unshift(notification)
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    items,
    isLoading,
    unreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
    addFromWS,
  }
})
