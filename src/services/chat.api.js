import { timeTrackApi } from './api'

export const getMyChats = async () => {
  try {
    const response = await timeTrackApi.get('/chats')
    return response.data
  } catch (error) {
    console.error('Ошибка при получении списка чатов:', error)
    throw error
  }
}

export const getChat = async (chatId) => {
  try {
    const response = await timeTrackApi.get(`/chats/${chatId}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при получении чата:', error)
    throw error
  }
}

export const createChat = async ({ type, name, participantIds }) => {
  try {
    const response = await timeTrackApi.post('/chats', { type, name, participantIds })
    return response.data
  } catch (error) {
    console.error('Ошибка при создании чата:', error)
    throw error
  }
}

export const renameChat = async (chatId, name) => {
  try {
    const response = await timeTrackApi.put(`/chats/${chatId}/name`, { name })
    return response.data
  } catch (error) {
    console.error('Ошибка при переименовании чата:', error)
    throw error
  }
}

export const setChatMuted = async (chatId, muted) => {
  try {
    const response = await timeTrackApi.put(`/chats/${chatId}/mute`, { muted })
    return response.data
  } catch (error) {
    console.error('Ошибка при изменении уведомлений чата:', error)
    throw error
  }
}

// Отдельно от setChatMuted — глушит только VK-дубликат, тост/браузер/звук
// в приложении продолжают работать как обычно.
export const setChatVKMuted = async (chatId, muted) => {
  try {
    const response = await timeTrackApi.put(`/chats/${chatId}/vk-mute`, { muted })
    return response.data
  } catch (error) {
    console.error('Ошибка при изменении VK-уведомлений чата:', error)
    throw error
  }
}

export const deleteChat = async (chatId) => {
  try {
    const response = await timeTrackApi.delete(`/chats/${chatId}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении чата:', error)
    throw error
  }
}

export const getChatParticipants = async (chatId) => {
  try {
    const response = await timeTrackApi.get(`/chats/${chatId}/participants`)
    return response.data
  } catch (error) {
    console.error('Ошибка при получении участников чата:', error)
    throw error
  }
}

export const addChatParticipant = async (chatId, userId, role = 'member') => {
  try {
    const response = await timeTrackApi.post(`/chats/${chatId}/participants`, {
      userId,
      role,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при добавлении участника:', error)
    throw error
  }
}

export const removeChatParticipant = async (chatId, userId) => {
  try {
    const response = await timeTrackApi.delete(`/chats/${chatId}/participants/${userId}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении участника:', error)
    throw error
  }
}

export const getChatMessages = async (chatId, { beforeId, limit } = {}) => {
  try {
    const response = await timeTrackApi.get(`/chats/${chatId}/messages`, {
      params: { beforeId, limit },
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error)
    throw error
  }
}

// entityRef — необязательная ссылка на сущность (например, заявку на
// отпуск): { entityType, entityId, entityTitle, entitySubtitle }.
export const sendChatMessage = async (chatId, body, entityRef = null) => {
  try {
    const response = await timeTrackApi.post(`/chats/${chatId}/messages`, {
      body,
      ...entityRef,
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error)
    throw error
  }
}

// files — массив File (можно один) — бэк принимает несколько полей "file"
// в одном multipart-запросе и привязывает их все к одному сообщению.
export const sendChatFileMessage = async (chatId, files, body = '') => {
  try {
    const formData = new FormData()
    for (const file of files) formData.append('file', file)
    if (body) formData.append('body', body)

    const response = await timeTrackApi.post(`/chats/${chatId}/messages/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    console.error('Ошибка при отправке файла:', error)
    throw error
  }
}

export const deleteChatMessage = async (chatId, messageId) => {
  try {
    const response = await timeTrackApi.delete(`/chats/${chatId}/messages/${messageId}`)
    return response.data
  } catch (error) {
    console.error('Ошибка при удалении сообщения:', error)
    throw error
  }
}

export const markChatRead = async (chatId, messageId) => {
  try {
    const response = await timeTrackApi.put(`/chats/${chatId}/read`, { messageId })
    return response.data
  } catch (error) {
    console.error('Ошибка при отметке чата прочитанным:', error)
    throw error
  }
}

// "Я сейчас смотрю в этот чат" / "я его закрыл" — эфемерные сигналы, как
// typing, нужны бэку только чтобы не слать VK-дубликат уведомления, пока
// человек и так сидит в чате в приложении (internal/chat/hub.go viewing).
export const setViewingChat = async (chatId) => {
  try {
    await timeTrackApi.put(`/chats/${chatId}/viewing`)
  } catch {
    // намеренно молча игнорируем — не критично, максимум придёт лишний VK-дубль
  }
}

export const clearViewingChat = async () => {
  try {
    await timeTrackApi.delete(`/chats/viewing`)
  } catch {
    // намеренно молча игнорируем
  }
}

export const sendChatTyping = async (chatId) => {
  // Эфемерный сигнал — не критично, если изредка потеряется, поэтому без
  // console.error/throw, чтобы не шуметь в консоли на каждое нажатие клавиши.
  try {
    await timeTrackApi.post(`/chats/${chatId}/typing`)
  } catch {
    // намеренно молча игнорируем
  }
}
