// Персистентные уведомления (таблица notifications на бэке) — список,
// который открывается по колокольчику в шапке, и общий источник тостов/
// звука/браузерных уведомлений для ВСЕГО, что через эту таблицу проходит
// (заявки на отпуск/больничный, новые сообщения и чаты — см.
// internal/notification/hub.go на бэке). Не путать со стором
// notification.js — тот про эфемерные тосты, этот про историю + SSE.
import router from '@/router'
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.api'
import { unwrapNull, unwrapNullString } from '@/utils/chat.utils'
import {
  notifyBrowser,
  playNotificationSound,
  primeAudioContext,
  requestBrowserNotificationPermission,
} from '@/utils/browserNotify.utils'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNotificationStore } from './notification'

// /apitime уже проксируется на бэк (см. vite.config.js) — тот же паттерн,
// что у STREAM_URL в stores/chat.js.
const STREAM_URL = '/apitime/notifications/stream'

export const useNotificationCenterStore = defineStore('notification-center', () => {
  const toastStore = useNotificationStore()

  const items = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)

  let eventSource = null

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

  async function deleteOne(id) {
    const item = items.value.find((n) => n.id === id)
    const wasUnread = !unwrapNull(item?.isRead, 'Bool')

    try {
      await deleteNotification(id)
      items.value = items.value.filter((n) => n.id !== id)
      if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // тихо игнорируем — не критично, попробуют ещё раз
    }
  }

  async function clearAll() {
    const previous = items.value
    const previousUnread = unreadCount.value
    items.value = []
    unreadCount.value = 0

    try {
      await deleteAllNotifications()
    } catch {
      items.value = previous
      unreadCount.value = previousUnread
    }
  }

  // Кликабельно только там, где есть куда вести: заявка на отпуск (у неё
  // есть отдельная страница-карточка; у больничных её нет — только общий
  // список) и чат (открываем тем же query-параметром, что и диплинк из VK,
  // см. pages/chat/Index.vue).
  function linkFor(item) {
    const entityType = unwrapNullString(item.entityType)
    const entityId = unwrapNullString(item.entityId)
    if (entityType === 'vacation' && entityId) {
      return { name: 'vacation-application', params: { id: entityId } }
    }
    if (entityType === 'chat' && entityId) {
      return { name: 'chats', query: { open: entityId } }
    }
    if (entityType === 'timesheet') {
      return { name: 'calendar' }
    }
    return null
  }

  function goTo(item) {
    const link = linkFor(item)
    if (link) router.push(link)
  }

  function connect() {
    if (eventSource) return

    requestBrowserNotificationPermission()
    primeAudioContext()

    eventSource = new EventSource(STREAM_URL, { withCredentials: true })

    eventSource.addEventListener('notification_created', (e) => {
      const item = JSON.parse(e.data)
      items.value = [item, ...items.value]
      unreadCount.value += 1

      toastStore.addNotification(`${item.title}: ${item.message}`, 'info', 6000, () => goTo(item))
      notifyBrowser(item.title, item.message, item.id, () => goTo(item))
      playNotificationSound()
    })

    // Прочитали сущность целиком (например, открыли чат) — гасим все её
    // накопленные уведомления разом, см. chat.Service.MarkRead на бэке.
    // Сколько именно строк там прочиталось, не знаем — просто гасим все
    // непрочитанные с таким entityType/entityId среди уже загруженных.
    eventSource.addEventListener('notifications_read', (e) => {
      const { entityType, entityId } = JSON.parse(e.data)
      let cleared = 0
      items.value.forEach((n) => {
        if (
          unwrapNullString(n.entityType) === entityType &&
          unwrapNullString(n.entityId) === entityId &&
          !unwrapNull(n.isRead, 'Bool')
        ) {
          n.isRead = { Bool: true, Valid: true }
          cleared++
        }
      })
      unreadCount.value = Math.max(0, unreadCount.value - cleared)
    })

    // Удалили в другой вкладке — синхронизируем список тут же.
    eventSource.addEventListener('notification_deleted', (e) => {
      const { id } = JSON.parse(e.data)
      const item = items.value.find((n) => n.id === id)
      if (!item) return
      const wasUnread = !unwrapNull(item.isRead, 'Bool')
      items.value = items.value.filter((n) => n.id !== id)
      if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)
    })

    eventSource.addEventListener('notifications_cleared', () => {
      items.value = []
      unreadCount.value = 0
    })

    eventSource.onerror = () => {
      // EventSource сам переподключается — тут ничего специально делать не нужно.
    }
  }

  function disconnect() {
    eventSource?.close()
    eventSource = null
  }

  return {
    items,
    unreadCount,
    isLoading,
    load,
    loadUnreadCount,
    markRead,
    markAllRead,
    deleteOne,
    clearAll,
    linkFor,
    connect,
    disconnect,
  }
})
