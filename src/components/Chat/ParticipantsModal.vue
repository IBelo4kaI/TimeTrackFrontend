<template>
  <ModalLayout title="Участники чата" @close="$emit('close')">
    <div class="participants-modal">
      <div v-for="p in chatStore.activeParticipants" :key="p.userId" class="participants-modal__row">
        <div class="participants-modal__avatar">{{ getUserInitials(userById(p.userId)) }}</div>
        <div class="participants-modal__info">
          <span class="participants-modal__name">{{ nameById(p.userId) }}</span>
          <span class="participants-modal__role">{{ p.role === 'admin' ? 'Админ' : 'Участник' }}</span>
        </div>

        <ButtonUI
          v-if="p.userId === userStore.user?.id"
          type="muted"
          @click="leave"
        >
          Покинуть
        </ButtonUI>
        <ButtonUI
          v-else-if="canManage"
          type="destructive"
          icon="fa-regular fa-user-xmark"
          v-tooltip="'Удалить из чата'"
          @click="remove(p.userId)"
        />
      </div>
    </div>
  </ModalLayout>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import ModalLayout from '@/layouts/ModalLayout.vue'
import { useChatStore } from '@/stores/chat'
import { useConfirmModal } from '@/stores/confirmModal'
import { useUserStore } from '@/stores/user'
import { getUserInitials } from '@/utils/chat.utils'
import { computed } from 'vue'

defineEmits(['close'])

const chatStore = useChatStore()
const userStore = useUserStore()
const confirmModalStore = useConfirmModal()

// Убрать кого-то ДРУГОГО может только создатель чата или участник с ролью
// admin — та же проверка, что и на бэке (internal/chat/service.go
// RemoveParticipant) и та же, что уже используется для canDelete в
// ChatThread.vue.
const canManage = computed(() => {
  const chat = chatStore.activeChat
  if (!chat) return false
  if (chat.createdByUserId === userStore.user?.id) return true
  const me = chatStore.activeParticipants.find((p) => p.userId === userStore.user?.id)
  return me?.role === 'admin'
})

function userById(userId) {
  return userStore.usersAll.find((u) => u.id === userId)
}

function nameById(userId) {
  const u = userById(userId)
  return u ? [u.surname, u.name].filter(Boolean).join(' ') : 'Сотрудник'
}

function remove(userId) {
  confirmModalStore.open(
    () => chatStore.removeParticipant(userId),
    `Удалить ${nameById(userId)} из чата?`
  )
}

function leave() {
  confirmModalStore.open(
    () => chatStore.removeParticipant(userStore.user?.id),
    'Покинуть этот чат?'
  )
}
</script>

<style scoped>
.participants-modal {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  max-height: 24rem;
  overflow-y: auto;
}

.participants-modal__row {
  display: flex;
  align-items: center;
  gap: 0.71rem;
  padding: 0.57rem;
  border-radius: var(--border-radius);
}

.participants-modal__row:hover {
  background: var(--background);
}

.participants-modal__avatar {
  flex-shrink: 0;
  width: 2.29rem;
  height: 2.29rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.86rem;
  font-weight: 700;
}

.participants-modal__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.participants-modal__name {
  color: var(--text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participants-modal__role {
  font-size: 0.79rem;
  color: var(--muted-text);
}
</style>
