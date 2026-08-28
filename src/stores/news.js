// Новости/чейнджлог приложения — бейдж непрочитанного в шапке (NewsBell.vue)
// + модалка "что нового" при входе (WhatsNewModal.vue). Без SSE — не
// настолько срочно, как заявки/сообщения, достаточно перечитывать при заходе.
import { getNews, getNewsUnreadCount, markNewsSeen } from '@/services/news.api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNewsStore = defineStore('news', () => {
  const items = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)

  async function load() {
    isLoading.value = true
    try {
      items.value = (await getNews()) ?? []
    } catch {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadUnreadCount() {
    try {
      unreadCount.value = await getNewsUnreadCount()
    } catch {
      // не критично — просто не обновится бейдж
    }
  }

  async function markSeen() {
    if (unreadCount.value === 0) return
    const previous = unreadCount.value
    unreadCount.value = 0
    try {
      await markNewsSeen()
    } catch {
      unreadCount.value = previous
    }
  }

  return {
    items,
    unreadCount,
    isLoading,
    load,
    loadUnreadCount,
    markSeen,
  }
})
