<template>
  <div class="chat-list">
    <div class="chat-list__header">
      <InputUi v-model="search" placeholder="Поиск по чатам">
        <template #prefix><i class="fa-regular fa-magnifying-glass"></i></template>
      </InputUi>
      <ButtonUI icon="fa-regular fa-pen-to-square" v-tooltip="'Новый чат'" @click="$emit('create')" />
    </div>

    <div class="chat-list__items">
      <LoaderTitle v-if="chatStore.isLoadingChats" />

      <div v-else-if="!filteredChats.length" class="chat-list__empty">
        <i class="fa-regular fa-comments"></i>
        <span>{{ chatStore.chats.length ? 'Ничего не найдено' : 'Чатов пока нет' }}</span>
      </div>

      <ChatListItem
        v-for="chat in filteredChats"
        :key="chat.id"
        :chat="chat"
        :participants="chatStore.participantsByChat[chat.id] ?? []"
        :active="chat.id === chatStore.activeChatId"
        @click="chatStore.openChat(chat.id)"
      />
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { getChatDisplayName } from '@/utils/chat.utils'
import { computed, ref } from 'vue'
import ChatListItem from './ChatListItem.vue'

defineEmits(['create'])

const chatStore = useChatStore()
const userStore = useUserStore()
const search = ref('')

const filteredChats = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return chatStore.chats

  return chatStore.chats.filter((chat) => {
    const name = getChatDisplayName(
      chat,
      chatStore.participantsByChat[chat.id] ?? [],
      userStore.user?.id,
      userStore.usersAll
    )
    return name.toLowerCase().includes(term)
  })
})
</script>

<style scoped>
.chat-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  overflow: hidden;
}

.chat-list__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: var(--padding-secondary);
  border-bottom: 0.07rem solid var(--border-color);
}

.chat-list__items {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
}

.chat-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.71rem;
  padding: 3rem 1rem;
  color: var(--muted-text);
  font-size: 0.93rem;
}

.chat-list__empty i {
  font-size: 1.71rem;
}
</style>
