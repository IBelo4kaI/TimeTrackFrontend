import {
  addChatParticipant,
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
} from '@/services/chat.api'
import router from '@/router'
import { getChatDisplayName, unwrapNullString } from '@/utils/chat.utils'
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
  const totalUnread = computed(() =>
    chats.value.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)
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
      await sendChatMessage(chatId, body.trim(), entityRef)
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
      await sendChatFileMessage(chatId, list, caption.trim())
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

    requestBrowserNotificationPermission()
    primeAudioContext()

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
        notifyNewMessage(message)
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
    // перезапросить список целиком, чем гадать.
    eventSource.addEventListener('chat_created', async (e) => {
      const { chatId } = JSON.parse(e.data)
      await loadChats()

      const chat = chats.value.find((c) => c.id === chatId)
      const name = chat
        ? getChatDisplayName(
            chat,
            participantsByChat.value[chatId] ?? [],
            userStore.user?.id,
            userStore.usersAll
          )
        : null

      notificationStore.addNotification(
        name ? `Новый чат: ${name}` : 'У вас новый чат',
        'info',
        6000,
        () => goToChat(chatId)
      )
      notifyBrowser('Новый чат', name ?? 'У вас новый чат', chatId, () => goToChat(chatId))
      playNotificationSound()
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

  // Открывает чат и уводит на страницу чатов — action для кликабельного
  // тоста уведомления (новое сообщение/новый чат), работает из любой страницы.
  function goToChat(chatId) {
    openChat(chatId)
    if (router.currentRoute.value.name !== 'chats') {
      router.push({ name: 'chats' })
    }
  }

  function notifyNewMessage(message) {
    if (chats.value.find((c) => c.id === message.chatId)?.muted) return

    const sender = userStore.usersAll.find((u) => u.id === message.senderUserId)
    const senderName = sender
      ? [sender.surname, sender.name].filter(Boolean).join(' ')
      : 'Сотрудник'
    // Сообщение может быть файлом без подписи (body пустой) — тогда в
    // превью тоста показываем что вложено, а не пустую строку после двоеточия.
    let preview = message.body.length > 60 ? `${message.body.slice(0, 60)}…` : message.body
    if (!preview && message.attachments?.length) {
      preview = message.attachments.length > 1 ? '📎 Файлы' : `📎 ${message.attachments[0].originalName}`
    } else if (!preview && unwrapNullString(message.entityType)) {
      preview = `🔗 ${unwrapNullString(message.entityTitle) ?? 'Ссылка на заявку'}`
    }

    notificationStore.addNotification(`${senderName}: ${preview}`, 'info', 6000, () =>
      goToChat(message.chatId)
    )
    notifyBrowser(senderName, preview, message.chatId, () => goToChat(message.chatId))
    playNotificationSound()
  }

  // --- Уведомления браузера (Notification API) ---

  // Спрашиваем только если ответа ещё не было — повторный запрос при
  // "denied" браузеры и так молча игнорируют, а при "granted" он не нужен.
  function requestBrowserNotificationPermission() {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') Notification.requestPermission()
  }

  // Нативное уведомление — только пока вкладка не в фокусе, иначе дублирует
  // уже видимый тост. tag группирует уведомления по чату (новое заменяет
  // предыдущее непрочитанное из того же чата, а не копится поверх).
  function notifyBrowser(title, body, tag, onClick) {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') {
      console.warn('[chat] уведомление браузера не показано, permission =', Notification.permission)
      return
    }
    if (!document.hidden && document.hasFocus()) return

    const notification = new Notification(title, { body, icon: '/favicon.ico', tag })
    notification.onclick = () => {
      window.focus()
      onClick?.()
      notification.close()
    }
  }

  // Короткий "дзынь" через Web Audio — без mp3-файла, чтобы не таскать
  // отдельный ассет. Один AudioContext на вкладку, создаём лениво.
  let audioCtx = null

  // Автоплей-политика браузера не даёт стартовать AudioContext без жеста
  // пользователя — resume() из playNotificationSound() к моменту реального
  // уведомления это уже не спасает. Прогреваем на первый же клик/клавишу/тап
  // по странице, задолго до того, как звук реально понадобится.
  function primeAudioContext() {
    const unlock = () => {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()
      if (audioCtx.state === 'suspended') audioCtx.resume()
    }
    document.addEventListener('click', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
    document.addEventListener('touchstart', unlock, { once: true })
  }

  function playTone(ctx, freq, startAt, duration) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, startAt)
    gain.gain.setValueAtTime(0.0001, startAt)
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

    osc.start(startAt)
    osc.stop(startAt + duration)
  }

  async function playNotificationSound() {
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)()

      // Без клика/тапа по странице контекст создаётся в состоянии
      // "suspended" (автоплей-политика браузера) — без явного resume()
      // звука просто не будет, без единой ошибки в консоли.
      if (audioCtx.state === 'suspended') await audioCtx.resume()

      const now = audioCtx.currentTime
      // Два восходящих тона ("динь-дон") вместо одного плоского бипа.
      playTone(audioCtx, 659.25, now, 0.13) // E5
      playTone(audioCtx, 987.77, now + 0.11, 0.22) // B5
    } catch (err) {
      console.warn('[chat] звук уведомления не сыграл:', err)
    }
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
    createNewChat,
    renameActiveChat,
    toggleMute,
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
