// Персистентные уведомления (таблица notifications на бэке) — список,
// который открывается по колокольчику в шапке. Не путать со стором
// notification.js — тот про эфемерные тосты, этот про историю.
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.api'
import { unwrapNull } from '@/utils/chat.utils'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationCenterStore = defineStore('notification-center', () => {
  const items = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)

  async function load() {
    isLoading.value = true
    try {
      items.value = (await getNotifications({ limit: 30 })) ?? []
    } catch {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadUnreadCount() {
    try {
      unreadCount.value = await getUnreadNotificationsCount()
    } catch {
      // не критично — просто не обновится бейдж
    }
  }

  async function markRead(id) {
    const item = items.value.find((n) => n.id === id)
    if (unwrapNull(item?.isRead, 'Bool')) return // уже прочитано

    try {
      await markNotificationRead(id)
      if (item) item.isRead = { Bool: true, Valid: true }
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // тихо игнорируем — не критично
    }
  }

  async function markAllRead() {
    const hadUnread = unreadCount.value > 0
    try {
      await markAllNotificationsRead()
      items.value.forEach((n) => (n.isRead = { Bool: true, Valid: true }))
      unreadCount.value = 0
    } catch {
      if (hadUnread) {
        // оставляем как было — попробуют ещё раз
      }
    }
  }

  return {
    items,
    unreadCount,
    isLoading,
    load,
    loadUnreadCount,
    markRead,
    markAllRead,
  }
})
