<template>
  <button type="button" class="chat-item" :class="{ 'chat-item--active': active }" @click="$emit('click')">
    <div class="chat-item__avatar" :class="{ 'chat-item__avatar--group': chat.type === 'group' }">
      <i v-if="chat.type === 'group'" class="fa-regular fa-users"></i>
      <template v-else>{{ initials }}</template>
    </div>

    <div class="chat-item__body">
      <div class="chat-item__top">
        <span class="chat-item__name">{{ name }}</span>
        <span v-if="time" class="chat-item__time">{{ time }}</span>
      </div>
      <div class="chat-item__bottom">
        <span class="chat-item__hint">
          {{ chat.type === 'group' ? 'Групповой чат' : 'Личный чат' }}
        </span>
        <span v-if="chat.unreadCount" class="chat-item__unread">{{ chat.unreadCount }}</span>
      </div>
    </div>
  </button>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import {
  formatMessageTime,
  getChatDisplayName,
  getUserInitials,
  unwrapNullTime,
} from '@/utils/chat.utils'
import { computed } from 'vue'

const props = defineProps({
  chat: { type: Object, required: true },
  participants: { type: Array, default: () => [] },
  active: { type: Boolean, default: false },
})
defineEmits(['click'])

const userStore = useUserStore()

const name = computed(() =>
  getChatDisplayName(props.chat, props.participants, userStore.user?.id, userStore.usersAll)
)

const otherUser = computed(() => {
  if (props.chat.type === 'group') return null
  const other = props.participants.find((p) => p.userId !== userStore.user?.id)
  return other ? userStore.usersAll.find((u) => u.id === other.userId) : null
})

const initials = computed(() => getUserInitials(otherUser.value))

const time = computed(() => formatMessageTime(unwrapNullTime(props.chat.lastMessageAt)))
</script>

<style scoped>
.chat-item {
  display: flex;
  align-items: center;
  gap: 0.71rem;
  width: 100%;
  padding: 0.71rem;
  background: none;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.chat-item:hover {
  background: var(--background);
}

.chat-item--active {
  background: var(--muted-accent);
}

.chat-item__avatar {
  flex-shrink: 0;
  width: 2.86rem;
  height: 2.86rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
}

.chat-item__avatar--group {
  background: var(--muted-foreground);
  color: var(--muted-text);
}

.chat-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.21rem;
}

.chat-item__top,
.chat-item__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.chat-item__name {
  font-weight: 600;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item__time {
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--muted-text);
}

.chat-item__hint {
  font-size: 0.86rem;
  color: var(--muted-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-item__unread {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.29rem;
  height: 1.29rem;
  padding: 0 0.36rem;
  border-radius: 1rem;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 0.75rem;
  font-weight: 700;
}
</style>
