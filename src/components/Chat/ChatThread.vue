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
      </div>

      <div ref="messagesEl" class="thread__messages">
        <LoaderTitle v-if="chatStore.isLoadingMessages" />

        <div
          v-else-if="!chatStore.activeMessages.length"
          class="thread__empty-messages"
        >
          Сообщений пока нет — напишите первым
        </div>

        <ChatMessage
          v-for="message in chatStore.activeMessages"
          :key="message.id"
          :message="message"
          :is-own="message.senderUserId === userStore.user?.id"
          :show-sender="isGroup && message.senderUserId !== userStore.user?.id"
          :sender-name="senderName(message.senderUserId)"
          @delete="chatStore.removeMessage"
        />
      </div>

      <div class="thread__typing" v-if="typingText">
        <span>{{ typingText }}</span>
      </div>

      <div class="thread__composer">
        <input
          ref="fileInput"
          type="file"
          style="display: none"
          @change="onFileSelected"
        />
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-paperclip"
          v-tooltip="'Прикрепить файл'"
          :disabled="chatStore.isSendingFile"
          @click="fileInput.click()"
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
          :disabled="!draft.trim()"
          @click="send"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { useChatStore } from '@/stores/chat'
import { useConfirmModal } from '@/stores/confirmModal'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import {
  getChatDisplayName,
  getUserInitials,
  unwrapNullString,
} from '@/utils/chat.utils'
import { computed, nextTick, ref, watch } from 'vue'
import ChatMessage from './ChatMessage.vue'
import ParticipantsPicker from './ParticipantsPicker.vue'

const chatStore = useChatStore()
const userStore = useUserStore()
const modalStore = useUniversalModalStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()

const draft = ref('')
const messagesEl = ref(null)
const fileInput = ref(null)

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

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

async function send() {
  const body = draft.value
  draft.value = ''
  await chatStore.sendMessage(body)
}

// --- Отправка файла ---
async function onFileSelected(event) {
  const selected = event.target.files[0]
  event.target.value = '' // чтобы повторный выбор того же файла тоже сработал

  if (!selected) return

  if (selected.size > MAX_FILE_SIZE) {
    notificationStore.addNotification(
      'Файл слишком большой. Максимальный размер: 20MB',
      'error'
    )
    return
  }

  const caption = draft.value
  draft.value = ''
  await chatStore.sendFileMessage(selected, caption)
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

// --- Автоскролл вниз при новых сообщениях/открытии чата ---
function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value)
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

watch(() => chatStore.activeChatId, scrollToBottom)
watch(() => chatStore.activeMessages.length, scrollToBottom)
</script>

<style scoped>
.thread {
  display: flex;
  flex-direction: column;
  height: 100%;
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
  overflow-y: auto;
  padding: var(--padding-secondary);
  display: flex;
  flex-direction: column;
  gap: 0.57rem;
}

.thread__typing {
  padding: 0 var(--padding-secondary);
  font-size: 0.79rem;
  color: var(--muted-text);
  font-style: italic;
  height: 1.5rem;
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
