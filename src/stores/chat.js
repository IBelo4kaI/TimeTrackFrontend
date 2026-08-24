import {
  addChatParticipant,
  clearViewingChat,
  createChat,
  deleteChat as deleteChatApi,
  deleteChatMessage,
  getChatMessages,
  getChatParticipants,
  getMyChats,
  markChatRead,
  removeChatParticipant,
  renameChat,
  sendChatFileMessage,
  sendChatMessage,
  sendChatTyping,
  setChatMuted,
  setChatVKMuted,
  setViewingChat,
} from '@/services/chat.api'
import router from '@/router'
import { getSelfFullName } from '@/utils/user.utils'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useNotificationStore } from './notification'
import { useUserStore } from './user'

// /apitime уже проксируется на бэк (см. vite.config.js), EventSource с
// withCredentials шлёт ту же cookie-сессию, что и обычные axios-запросы —
// отдельного механизма авторизации для SSE заводить не пришлось.
const STREAM_URL = '/apitime/chats/stream'

// Сколько показываем "печатает" после последнего сигнала, если новый не пришёл.
const TYPING_TTL = 4000

export const useChatStore = defineStore('chat', () => {
  const userStore = useUserStore()
  const notificationStore = useNotificationStore()

  const chats = ref([])
  const isLoadingChats = ref(false)
  const activeChatId = ref(null)

  const messagesByChat = ref({}) // chatId -> ChatMessage[]
  const isLoadingMessages = ref(false)

  const participantsByChat = ref({}) // chatId -> ChatParticipant[]

  // chatId -> { userId: true } — кто сейчас печатает. Плоский объект, а не
  // Map, чтобы Vue реактивность подхватывала изменения без doп. обёрток.
  const typingByChat = ref({})
  const typingTimers = new Map() // не реактивно, просто таймеры очистки

  let eventSource = null

  const activeChat = computed(() => chats.value.find((c) => c.id === activeChatId.value) ?? null)
  const activeMessages = computed(() => messagesByChat.value[activeChatId.value] ?? [])
  const activeParticipants = computed(
    () => participantsByChat.value[activeChatId.value] ?? []
  )
  const activeTypingUserIds = computed(() =>
    Object.keys(typingByChat.value[activeChatId.value] ?? {})
  )
  // Кол-во чатов с непрочитанным, а не сумма непрочитанных сообщений.
  const totalUnread = computed(
    () => chats.value.filter((c) => (c.unreadCount ?? 0) > 0).length
  )

  // --- Чаты ---

  async function loadChats() {
    isLoadingChats.value = true
    try {
      const list = (await getMyChats()) ?? []
      chats.value = list

      // Для личных чатов участников подгружаем сразу — иначе список не
      // покажет, с кем это переписка. Для групповых имя уже есть на самом
      // чате, участники им нужны только внутри открытого треда.
      await Promise.all(
        list
          .filter((c) => c.type === 'direct' && !participantsByChat.value[c.id])
          .map((c) => loadParticipants(c.id))
      )
    } catch {
      notificationStore.addNotification('Не удалось загрузить чаты', 'error')
    } finally {
      isLoadingChats.value = false
    }
  }

  async function loadParticipants(chatId) {
    try {
      participantsByChat.value[chatId] = (await getChatParticipants(chatId)) ?? []
    } catch {
      participantsByChat.value[chatId] = []
    }
  }

  async function openChat(chatId) {
    activeChatId.value = chatId
    setViewingChat(chatId)

    if (!participantsByChat.value[chatId]) {
      await loadParticipants(chatId)
    }

    isLoadingMessages.value = true
    try {
      const page = (await getChatMessages(chatId, { limit: 50 })) ?? []
      // Бэк отдаёт последние сообщения по убыванию id (для пагинации назад) —
      // для показа в ленте нужен хронологический порядок.
      messagesByChat.value[chatId] = [...page].reverse()
    } catch {
      notificationStore.addNotification('Не удалось загрузить сообщения', 'error')
      messagesByChat.value[chatId] = []
    } finally {
      isLoadingMessages.value = false
    }

    await markAsRead(chatId)
  }

  // "Антивыбор" — закрыть открытый чат, ничего не выбирая взамен.
  function closeChat() {
    activeChatId.value = null
    clearViewingChat()
  }

  async function createNewChat({ participantIds, name }) {
    const type = participantIds.length > 1 ? 'group' : 'direct'
    const chat = await createChat({ type, name: name ?? '', participantIds })
    chats.value = [chat, ...chats.value.filter((c) => c.id !== chat.id)]
    return chat
  }

  async function renameActiveChat(name) {
    if (!activeChatId.value) return
    await renameChat(activeChatId.value, name)
    const chat = chats.value.find((c) => c.id === activeChatId.value)
    if (chat) chat.name = { String: name, Valid: name !== '' }
  }

  // Личное для текущего пользователя (не влияет на остальных участников) —
  // глушит тост/браузерное уведомление/звук по этому чату; бейдж
  // непрочитанных продолжает считать как обычно.
  async function toggleMute(chatId, muted) {
    const chat = chats.value.find((c) => c.id === chatId)
    if (!chat) return

    const previous = chat.muted
    chat.muted = muted // оптимистично
    try {
      await setChatMuted(chatId, muted)
    } catch {
      chat.muted = previous
      notificationStore.addNotification('Не удалось изменить уведомления чата', 'error')
    }
  }

  // Отдельно от toggleMute — глушит только VK-дубликат, приложение
  // продолжает уведомлять как обычно (тост/браузер/звук/бейдж).
  async function toggleVKMute(chatId, muted) {
    const chat = chats.value.find((c) => c.id === chatId)
    if (!chat) return

    const previous = chat.vkMuted
    chat.vkMuted = muted
    try {
      await setChatVKMuted(chatId, muted)
    } catch {
      chat.vkMuted = previous
      notificationStore.addNotification('Не удалось изменить VK-уведомления чата', 'error')
    }
  }

  async function addParticipant(userId) {
    if (!activeChatId.value) return
    await addChatParticipant(activeChatId.value, userId)
    await loadParticipants(activeChatId.value)
  }

  // userId === себе — это и есть "выйти из чата" (бэк это разрешает всем
  // участникам; удалить кого-то ДРУГОГО может только создатель/админ, см.
  // internal/chat/service.go RemoveParticipant).
  async function removeParticipant(userId) {
    const chatId = activeChatId.value
    if (!chatId) return

    try {
      await removeChatParticipant(chatId, userId)
      if (userId === userStore.user?.id) {
        forgetChat(chatId)
      } else {
        await loadParticipants(chatId)
      }
    } catch {
      notificationStore.addNotification('Не удалось удалить участника', 'error')
    }
  }

  async function deleteChat(chatId) {
    try {
      await deleteChatApi(chatId)
      forgetChat(chatId)
    } catch {
      notificationStore.addNotification('Не удалось удалить чат', 'error')
    }
  }

  // Убирает чат из локального состояния — и после собственного удаления,
  // и когда собеседник удалил чат первым (событие chat_deleted по SSE).
  function forgetChat(chatId) {
    chats.value = chats.value.filter((c) => c.id !== chatId)
    delete messagesByChat.value[chatId]
    delete participantsByChat.value[chatId]
    delete typingByChat.value[chatId]
    if (activeChatId.value === chatId) activeChatId.value = null
  }

  // --- Сообщения ---

  async function sendMessage(body, entityRef = null) {
    const chatId = activeChatId.value
    if (!chatId || (!body.trim() && !entityRef)) return

    try {
      // Сообщение в ленту добавит SSE-событие message_created (в т.ч. для
      // собственных сообщений — бэк рассылает всем участникам без
      // исключения отправителя, это упрощает синхронизацию между вкладками).
      await sendChatMessage(chatId, body.trim(), entityRef, getSelfFullName(userStore.user))
    } catch {
      notificationStore.addNotification('Не удалось отправить сообщение', 'error')
    }
  }

  const isSendingFile = ref(false)

  // files — один File или массив File.
  async function sendFileMessage(files, caption = '') {
    const chatId = activeChatId.value
    const list = Array.isArray(files) ? files : [files].filter(Boolean)
    if (!chatId || !list.length) return

    isSendingFile.value = true
    try {
      // Как и с текстом — в ленту сообщение попадёт по SSE message_created
      // (рассылается всем участникам, включая отправителя).
      await sendChatFileMessage(chatId, list, caption.trim(), getSelfFullName(userStore.user))
    } catch {
      notificationStore.addNotification('Не удалось отправить файл', 'error')
    } finally {
      isSendingFile.value = false
    }
  }

  async function removeMessage(messageId) {
    const chatId = activeChatId.value
    if (!chatId) return
    try {
      await deleteChatMessage(chatId, messageId)
    } catch {
      notificationStore.addNotification('Не удалось удалить сообщение', 'error')
    }
  }

  async function markAsRead(chatId) {
    const messages = messagesByChat.value[chatId]
    if (!messages?.length) return

    const lastId = messages[messages.length - 1].id
    const chat = chats.value.find((c) => c.id === chatId)
    if (chat) chat.unreadCount = 0

    try {
      await markChatRead(chatId, lastId)
    } catch {
      // не критично — при следующем открытии просто попробуем снова
    }
  }

  let typingDebounce = null
  function notifyTyping() {
    if (!activeChatId.value) return
    // Не долбим сервер на каждое нажатие клавиши.
    if (typingDebounce) return
    sendChatTyping(activeChatId.value)
    typingDebounce = setTimeout(() => {
      typingDebounce = null
    }, 2000)
  }

  // --- SSE ---

  function connect() {
    if (eventSource) return

    // Запрос разрешения на браузерные уведомления и прогрев звука теперь
    // делает notificationCenter.js (общий источник тостов/звука/браузерных
    // уведомлений, включая чатовые — см. connect() там).
    eventSource = new EventSource(STREAM_URL, { withCredentials: true })

    eventSource.addEventListener('message_created', (e) => {
      const message = JSON.parse(e.data)
      const list = messagesByChat.value[message.chatId] ?? []
      messagesByChat.value[message.chatId] = [...list, message]

      touchChatOrder(message.chatId, message.createdAt)

      const isOwn = message.senderUserId === userStore.user?.id

      if (isViewingChat(message.chatId)) {
        markAsRead(message.chatId)
      } else if (!isOwn) {
        const chat = chats.value.find((c) => c.id === message.chatId)
        if (chat) chat.unreadCount = (chat.unreadCount ?? 0) + 1
        // Тост/звук/браузерное уведомление о новом сообщении теперь приходят
        // из notificationCenter.js (общая таблица notifications + свой SSE) —
        // здесь только обновляем счётчик непрочитанных для сайдбара.
      }

      clearTyping(message.chatId, message.senderUserId)
    })

    eventSource.addEventListener('message_deleted', (e) => {
      const { chatId, messageId } = JSON.parse(e.data)
      const list = messagesByChat.value[chatId]
      if (!list) return
      messagesByChat.value[chatId] = list.filter((m) => m.id !== messageId)
    })

    eventSource.addEventListener('typing', (e) => {
      const { chatId, userId } = JSON.parse(e.data)
      if (userId === userStore.user?.id) return

      if (!typingByChat.value[chatId]) typingByChat.value[chatId] = {}
      typingByChat.value[chatId] = { ...typingByChat.value[chatId], [userId]: true }

      const key = `${chatId}:${userId}`
      clearTimeout(typingTimers.get(key))
      typingTimers.set(
        key,
        setTimeout(() => clearTyping(chatId, userId), TYPING_TTL)
      )
    })

    eventSource.addEventListener('read_receipt', () => {
      // Пока нигде в UI не показываем "прочитано собеседником" отдельно —
      // задел на будущее, событие уже долетает.
    })

    eventSource.addEventListener('chat_deleted', (e) => {
      const { chatId } = JSON.parse(e.data)
      // Один и тот же ивент шлётся и при удалении чата (личного/группового),
      // и при исключении из группового чата участника (RemoveParticipant на
      // бэке) — текст тоста уточняем по типу чата, пока он ещё есть в списке.
      const chat = chats.value.find((c) => c.id === chatId)
      const message =
        chat?.type === 'group' ? 'Вас удалили из группового чата' : 'Собеседник удалил чат'
      forgetChat(chatId)
      notificationStore.addNotification(message, 'info')
    })

    // Кого-то другого убрали из группового чата (или он вышел сам) — у нас
    // самих доступ к чату сохраняется, просто обновляем состав уже открытого
    // треда локально (без похода на сервер — участник уже известен по id).
    eventSource.addEventListener('participant_removed', (e) => {
      const { chatId, userId } = JSON.parse(e.data)
      const list = participantsByChat.value[chatId]
      if (!list) return
      participantsByChat.value[chatId] = list.filter((p) => p.userId !== userId)
    })

    // Пришло сразу при создании чата (собеседнику) и при добавлении в
    // существующий групповой чат — в обоих случаях у нас нет персональных
    // (role/unreadCount) данных этого чата под текущего юзера, проще
    // перезапросить список целиком, чем гадать. Тост/звук/браузерное
    // уведомление — из notificationCenter.js, см. message_created выше.
    eventSource.addEventListener('chat_created', async () => {
      await loadChats()
    })

    eventSource.onerror = () => {
      // EventSource сам переподключается — тут ничего специально делать не нужно.
    }
  }

  function disconnect() {
    eventSource?.close()
    eventSource = null
    typingTimers.forEach((t) => clearTimeout(t))
    typingTimers.clear()
  }

  // "Смотрит" — не просто activeChatId совпал (это состояние переживает уход
  // со страницы), а реально открыта страница чатов именно с этим чатом.
  function isViewingChat(chatId) {
    return router.currentRoute.value.name === 'chats' && activeChatId.value === chatId
  }

  function clearTyping(chatId, userId) {
    if (!typingByChat.value[chatId]) return
    const next = { ...typingByChat.value[chatId] }
    delete next[userId]
    typingByChat.value[chatId] = next
  }

  function touchChatOrder(chatId, lastMessageAt) {
    const chat = chats.value.find((c) => c.id === chatId)
    if (!chat) return
    chat.lastMessageAt = { Time: lastMessageAt, Valid: true }
    chats.value = [chat, ...chats.value.filter((c) => c.id !== chatId)]
  }

  return {
    chats,
    isLoadingChats,
    activeChatId,
    activeChat,
    activeMessages,
    activeParticipants,
    activeTypingUserIds,
    isLoadingMessages,
    totalUnread,
    participantsByChat,

    loadChats,
    loadParticipants,
    openChat,
    closeChat,
    createNewChat,
    renameActiveChat,
    toggleMute,
    toggleVKMute,
    addParticipant,
    removeParticipant,
    deleteChat,
    sendMessage,
    sendFileMessage,
    isSendingFile,
    removeMessage,
    notifyTyping,
    connect,
    disconnect,
  }
})
