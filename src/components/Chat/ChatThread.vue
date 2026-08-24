<template>
  <div class="thread">
    <div v-if="!chatStore.activeChat" class="thread__empty">
      <i class="fa-regular fa-comments"></i>
      <span>Выберите чат слева или создайте новый</span>
    </div>

    <template v-else>
      <div class="thread__header">
        <div
          class="thread__avatar"
          :class="{ 'thread__avatar--group': isGroup }"
        >
          <i v-if="isGroup" class="fa-regular fa-users"></i>
          <template v-else>{{ initials }}</template>
        </div>

        <div class="thread__title">
          <input
            v-if="isGroup && renaming"
            ref="renameInput"
            v-model="renameValue"
            class="thread__rename-input"
            @blur="saveRename"
            @keydown.enter="saveRename"
            @keydown.escape="renaming = false"
          />
          <span v-else class="thread__name" @dblclick="startRename">
            {{ name }}
            <i v-if="isGroup" class="fa-regular fa-pen thread__rename-icon"></i>
          </span>
          <span class="thread__hint">
            {{
              isGroup
                ? `${chatStore.activeParticipants.length} участников`
                : 'Личный чат'
            }}
          </span>
        </div>

        <ButtonUI
          type="muted-accent"
          :icon="chatStore.activeChat.muted || chatStore.activeChat.vkMuted ? 'fa-regular fa-bell-slash' : 'fa-regular fa-bell'"
          v-tooltip="'Уведомления'"
          @click="openNotificationsMenu"
        />
        <ButtonUI
          v-if="isGroup"
          type="muted-accent"
          icon="fa-regular fa-users"
          v-tooltip="'Участники'"
          @click="showParticipants = true"
        />
        <ButtonUI
          v-if="isGroup"
          type="muted-accent"
          icon="fa-regular fa-user-plus"
          v-tooltip="'Добавить участника'"
          @click="openAddParticipant"
        />
        <ButtonUI
          v-if="canDelete"
          type="destructive"
          icon="fa-regular fa-trash-can-xmark"
          v-tooltip="isGroup ? 'Удалить чат для всех' : 'Удалить чат'"
          @click="confirmDelete"
        />
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-xmark"
          v-tooltip="'Закрыть чат'"
          @click="chatStore.closeChat()"
        />
      </div>

      <div ref="messagesEl" class="thread__messages">
        <LoaderTitle v-if="chatStore.isLoadingMessages" />

        <div
          v-else-if="!chatStore.activeMessages.length"
          class="thread__empty-messages"
        >
          Сообщений пока нет — напишите первым
        </div>

        <template v-for="entry in messagesWithDateSeparators" :key="entry.key">
          <div v-if="entry.type === 'date'" class="thread__date-separator">
            <span>{{ entry.label }}</span>
          </div>
          <ChatMessage
            v-else
            :message="entry.message"
            :is-own="entry.message.senderUserId === userStore.user?.id"
            :show-sender="isGroup && entry.message.senderUserId !== userStore.user?.id"
            :sender-name="senderName(entry.message.senderUserId)"
            @delete="chatStore.removeMessage"
          />
        </template>
      </div>

      <div class="thread__typing" v-if="typingText">
        <span>{{ typingText }}</span>
      </div>

      <div v-if="attachedEntity" class="thread__attached-ref">
        <i class="fa-regular fa-plane-departure"></i>
        <div class="thread__attached-ref-info">
          <span class="thread__attached-ref-title">{{ attachedEntity.entityTitle }}</span>
          <span class="thread__attached-ref-subtitle">{{ attachedEntity.entitySubtitle }}</span>
        </div>
        <button
          type="button"
          class="thread__attached-ref-remove"
          @click="attachedEntity = null"
        >
          <i class="fa-regular fa-xmark"></i>
        </button>
      </div>

      <div v-if="attachedFiles.length" class="thread__attached-files">
        <div
          v-for="(file, index) in attachedFiles"
          :key="index"
          class="thread__attached-ref"
        >
          <i :class="fileIconClass(detectFileTypeFromMime(file.type))"></i>
          <div class="thread__attached-ref-info">
            <span class="thread__attached-ref-title">{{ file.name }}</span>
            <span class="thread__attached-ref-subtitle">{{ formatFileSize(file.size) }}</span>
          </div>
          <button
            type="button"
            class="thread__attached-ref-remove"
            @click="attachedFiles.splice(index, 1)"
          >
            <i class="fa-regular fa-xmark"></i>
          </button>
        </div>
      </div>

      <div class="thread__composer">
        <input
          ref="fileInput"
          type="file"
          multiple
          style="display: none"
          @change="onFileSelected"
        />
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-paperclip"
          v-tooltip="'Прикрепить файлы'"
          :disabled="chatStore.isSendingFile || !!attachedEntity"
          @click="fileInput.click()"
        />
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-link"
          v-tooltip="'Сослаться на заявку'"
          :disabled="!!attachedFiles.length"
          @click="openAttachEntity"
        />
        <textarea
          v-model="draft"
          class="thread__input"
          placeholder="Написать сообщение..."
          rows="1"
          @input="onInput"
          @keydown.enter.exact.prevent="send"
        ></textarea>
        <ButtonUI
          icon="fa-regular fa-paper-plane-top"
          :disabled="!draft.trim() && !attachedEntity && !attachedFiles.length"
          @click="send"
        />
      </div>
    </template>

    <ParticipantsModal v-if="showParticipants" @close="showParticipants = false" />
    <ContextMenu />
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import ContextMenu from '@/components/ContextMenu/ContextMenu.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { useChatStore } from '@/stores/chat'
import { useConfirmModal } from '@/stores/confirmModal'
import { useContextMenuStore } from '@/stores/contexMenu'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import {
  detectFileTypeFromMime,
  fileIconClass,
  formatFileSize,
  formatMessageDateLabel,
  getChatDisplayName,
  getUserInitials,
  isSameMessageDay,
  unwrapNullString,
} from '@/utils/chat.utils'
import { computed, nextTick, ref, watch } from 'vue'
import ChatMessage from './ChatMessage.vue'
import ParticipantsModal from './ParticipantsModal.vue'
import ParticipantsPicker from './ParticipantsPicker.vue'
import VacationRefPicker from './VacationRefPicker.vue'

const chatStore = useChatStore()
const userStore = useUserStore()
const modalStore = useUniversalModalStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()
const contextMenuStore = useContextMenuStore()

const showParticipants = ref(false)
const draft = ref('')
const messagesEl = ref(null)
const fileInput = ref(null)
const attachedEntity = ref(null)
const attachedFiles = ref([])

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_FILES = 10 // см. maxAttachmentsPerMessage в internal/chat/service.go

const isGroup = computed(() => chatStore.activeChat?.type === 'group')

const otherUser = computed(() => {
  if (isGroup.value || !chatStore.activeChat) return null
  const other = chatStore.activeParticipants.find(
    (p) => p.userId !== userStore.user?.id
  )
  return other ? userStore.usersAll.find((u) => u.id === other.userId) : null
})

const initials = computed(() => getUserInitials(otherUser.value))

const name = computed(() =>
  getChatDisplayName(
    chatStore.activeChat,
    chatStore.activeParticipants,
    userStore.user?.id,
    userStore.usersAll
  )
)

function senderName(userId) {
  const u = userStore.usersAll.find((x) => x.id === userId)
  return u ? [u.surname, u.name].filter(Boolean).join(' ') : 'Сотрудник'
}

// Сообщения вперемешку с разделителями дат — вставляем перед первым
// сообщением каждого нового дня.
const messagesWithDateSeparators = computed(() => {
  const result = []
  let prevCreatedAt = null

  for (const message of chatStore.activeMessages) {
    if (!isSameMessageDay(prevCreatedAt, message.createdAt)) {
      result.push({
        type: 'date',
        key: `date-${message.id}`,
        label: formatMessageDateLabel(message.createdAt),
      })
    }
    result.push({ type: 'message', key: message.id, message })
    prevCreatedAt = message.createdAt
  }

  return result
})

const typingText = computed(() => {
  const names = chatStore.activeTypingUserIds.map(senderName)
  if (!names.length) return ''
  return names.length === 1
    ? `${names[0]} печатает...`
    : 'Печатают несколько человек...'
})

function onInput() {
  chatStore.notifyTyping()
}

// Файл и ссылка на заявку — как и текст, только копятся в composer'е до
// нажатия "Отправить" (было: файл уходил сразу по выбору). Сочетать файл и
// ссылку в одном сообщении бэк не умеет (два разных эндпоинта), поэтому они
// взаимоисключающие — кнопки блокируют друг друга (см. :disabled в шаблоне).
async function send() {
  const body = draft.value
  const files = attachedFiles.value
  const entityRef = attachedEntity.value
  draft.value = ''
  attachedFiles.value = []
  attachedEntity.value = null

  if (files.length) {
    await chatStore.sendFileMessage(files, body)
  } else {
    await chatStore.sendMessage(body, entityRef)
  }
}

// --- Ссылка на заявку ---
function openAttachEntity() {
  modalStore.open({
    title: 'Сослаться на заявку',
    fields: [
      {
        name: 'vacationRef',
        type: 'component',
        component: VacationRefPicker,
        value: null,
      },
    ],
    submitButtonText: 'Прикрепить',
    onSubmit: async (formData) => {
      if (formData.vacationRef) attachedEntity.value = formData.vacationRef
    },
  })
}

// --- Прикрепление файлов (можно выбрать несколько сразу, можно повторить
// выбор ещё раз — новые добавляются к уже прикреплённым) ---
function onFileSelected(event) {
  const selected = [...event.target.files]
  event.target.value = '' // чтобы повторный выбор того же файла тоже сработал

  if (!selected.length) return

  const tooBig = selected.filter((f) => f.size > MAX_FILE_SIZE)
  const ok = selected.filter((f) => f.size <= MAX_FILE_SIZE)

  if (tooBig.length) {
    notificationStore.addNotification(
      `Файл слишком большой (макс. 20MB): ${tooBig.map((f) => f.name).join(', ')}`,
      'error'
    )
  }

  const next = [...attachedFiles.value, ...ok]
  if (next.length > MAX_FILES) {
    notificationStore.addNotification(`Можно прикрепить не более ${MAX_FILES} файлов`, 'error')
    attachedFiles.value = next.slice(0, MAX_FILES)
    return
  }

  attachedFiles.value = next
}

// --- Переименование группового чата (двойной клик по заголовку) ---
const renaming = ref(false)
const renameValue = ref('')
const renameInput = ref(null)

function startRename() {
  if (!isGroup.value) return
  renameValue.value = unwrapNullString(chatStore.activeChat.name) ?? ''
  renaming.value = true
  nextTick(() => renameInput.value?.focus())
}

async function saveRename() {
  if (!renaming.value) return
  renaming.value = false
  const value = renameValue.value.trim()
  if (value && value !== unwrapNullString(chatStore.activeChat.name)) {
    await chatStore.renameActiveChat(value)
  }
}

// --- Добавление участника ---
function openAddParticipant() {
  const currentIds = chatStore.activeParticipants.map((p) => p.userId)

  modalStore.open({
    title: 'Добавить участников',
    fields: [
      {
        name: 'participantIds',
        type: 'component',
        component: ParticipantsPicker,
        value: [...currentIds],
      },
    ],
    submitButtonText: 'Добавить',
    onSubmit: async (formData) => {
      const newIds = (formData.participantIds ?? []).filter(
        (id) => !currentIds.includes(id)
      )
      for (const id of newIds) {
        await chatStore.addParticipant(id)
      }
    },
  })
}

// --- Удаление чата ---
// Личный — любой из двух участников. Групповой — только создатель или
// участник с ролью admin (см. ту же проверку на бэке, internal/chat/service.go).
const canDelete = computed(() => {
  const chat = chatStore.activeChat
  if (!chat) return false
  if (chat.type !== 'group') return true
  if (chat.createdByUserId === userStore.user?.id) return true
  const me = chatStore.activeParticipants.find(
    (p) => p.userId === userStore.user?.id
  )
  return me?.role === 'admin'
})

function confirmDelete() {
  const chatId = chatStore.activeChatId
  confirmModalStore.open(
    () => chatStore.deleteChat(chatId),
    isGroup.value
      ? 'Удалить чат для всех участников? Все сообщения будут потеряны.'
      : 'Удалить чат? Переписка исчезнет у обеих сторон.'
  )
}

// --- Уведомления: полностью (тост/браузер/звук/VK) или только VK-дубликат ---
function openNotificationsMenu(event) {
  // contextMenuStore.openMenu вешает document click-listener на закрытие
  // синхронно, внутри вызова — без stopPropagation этот же клик, всплыв до
  // document, тут же сам себя и закрывает (contexMenu.js рассчитан на
  // @contextmenu, у него такой самозакрывающей коллизии нет).
  event.stopPropagation()

  const chat = chatStore.activeChat
  if (!chat) return

  const items = []

  if (chat.muted) {
    items.push({ action: 'enable-all', label: 'Включить уведомления' })
  } else {
    items.push(
      chat.vkMuted
        ? { action: 'enable-vk', label: 'Включить уведомления VK' }
        : { action: 'disable-vk', label: 'Отключить уведомления VK' }
    )
    items.push({ action: 'disable-all', label: 'Отключить все уведомления', danger: true })
  }

  contextMenuStore.openMenu(event, {
    items,
    onAction: (action) => {
      if (action === 'enable-all') {
        chatStore.toggleMute(chat.id, false)
        chatStore.toggleVKMute(chat.id, false)
      } else if (action === 'disable-all') {
        chatStore.toggleMute(chat.id, true)
      } else if (action === 'enable-vk') {
        chatStore.toggleVKMute(chat.id, false)
      } else if (action === 'disable-vk') {
        chatStore.toggleVKMute(chat.id, true)
      }
    },
  })
}

// --- Автоскролл вниз при новых сообщениях/открытии чата ---
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value)
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

watch(() => chatStore.activeChatId, scrollToBottom)
watch(() => chatStore.activeMessages.length, scrollToBottom)
// Переключились на другой чат — модалка участников, если была открыта,
// относилась к предыдущему.
watch(() => chatStore.activeChatId, () => (showParticipants.value = false))
</script>

<style scoped>
.thread {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* Без этого grid-элемент (.chat-page — грид) по умолчанию не сжимается
     ниже высоты своего контента (min-height: auto) — список сообщений
     тянул за собой высоту всей карточки вместо того, чтобы скроллиться
     внутри неё. */
  min-height: 0;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  overflow: hidden;
}

.thread__empty,
.thread__empty-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.71rem;
  color: var(--muted-text);
  font-size: 0.93rem;
}

.thread__empty i {
  font-size: 2rem;
}

.thread__header {
  display: flex;
  align-items: center;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  border-bottom: 0.07rem solid var(--border-color);
  flex-shrink: 0;
}

.thread__avatar {
  flex-shrink: 0;
  width: 2.57rem;
  height: 2.57rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.thread__avatar--group {
  background: var(--muted-foreground);
  color: var(--muted-text);
}

.thread__title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.thread__name {
  display: inline-flex;
  align-items: center;
  gap: 0.43rem;
  font-weight: 600;
  color: var(--text);
  cursor: default;
}

.thread__rename-icon {
  font-size: 0.71rem;
  color: var(--muted-text);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.thread__name:hover .thread__rename-icon {
  opacity: 1;
}

.thread__rename-input {
  font: inherit;
  font-weight: 600;
  color: var(--text);
  background: var(--background);
  border: 0.07rem solid var(--accent);
  border-radius: calc(var(--border-radius) * 0.5);
  padding: 0.14rem 0.43rem;
  outline: none;
}

.thread__hint {
  font-size: 0.79rem;
  color: var(--muted-text);
}

.thread__messages {
  flex: 1;
  /* Тот же трюк, но уже для flex-ребёнка: без min-height: 0 flex-элемент по
     умолчанию не сжимается ниже контента, и overflow-y: auto никогда не
     срабатывает — список просто растёт вместе с количеством сообщений. */
  min-height: 0;
  overflow-y: auto;
  padding: var(--padding-secondary);
  display: flex;
  flex-direction: column;
  gap: 0.57rem;
}

.thread__date-separator {
  display: flex;
  justify-content: center;
  margin: 0.36rem 0;
}

.thread__date-separator span {
  padding: 0.29rem 0.86rem;
  background: var(--muted-foreground);
  color: var(--muted-text);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
}

.thread__typing {
  padding: 0 var(--padding-secondary);
  font-size: 0.79rem;
  color: var(--muted-text);
  font-style: italic;
  height: 1.5rem;
}

.thread__attached-files {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  margin: 0 var(--padding-secondary);
  flex-shrink: 0;
}

.thread__attached-files .thread__attached-ref {
  margin: 0;
}

.thread__attached-ref {
  display: flex;
  align-items: center;
  gap: 0.71rem;
  margin: 0 var(--padding-secondary);
  padding: 0.5rem 0.86rem;
  background: var(--muted-accent);
  border-radius: var(--border-radius);
  flex-shrink: 0;
}

.thread__attached-ref i:first-child {
  font-size: 1.14rem;
  color: var(--accent);
  flex-shrink: 0;
}

.thread__attached-ref-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.thread__attached-ref-title {
  font-weight: 600;
  color: var(--accent);
  font-size: 0.86rem;
}

.thread__attached-ref-subtitle {
  font-size: 0.79rem;
  color: var(--muted-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thread__attached-ref-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.57rem;
  height: 1.57rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.thread__attached-ref-remove:hover {
  background: rgba(0, 0, 0, 0.08);
}

.thread__composer {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: var(--padding-secondary);
  border-top: 0.07rem solid var(--border-color);
  flex-shrink: 0;
}

.thread__input {
  flex: 1;
  display: flex;
  align-items: center;
  resize: none;
  max-height: 8rem;
  height: 3rem;
  padding: 0.75rem 0.86rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--foreground);
  color: var(--text);
  font: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.thread__input:focus {
  border-color: var(--accent);
}
</style>
