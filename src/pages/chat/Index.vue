<template>
  <div class="chat-page">
    <ChatList @create="openNewChatModal" />
    <ChatThread />
  </div>
</template>

<script setup>
import ChatList from '@/components/Chat/ChatList.vue'
import ChatThread from '@/components/Chat/ChatThread.vue'
import ParticipantsPicker from '@/components/Chat/ParticipantsPicker.vue'
import { useChatStore } from '@/stores/chat'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Чаты', 'Личные и групповые обсуждения')

const chatStore = useChatStore()
const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()
const route = useRoute()

function openNewChatModal() {
  modalStore.open({
    title: 'Новый чат',
    fields: [
      {
        name: 'participantIds',
        type: 'component',
        component: ParticipantsPicker,
        value: [],
      },
      {
        name: 'name',
        type: 'text',
        label: 'Название группы',
        placeholder: 'Например, «Отдел продаж» (необязательно для личного чата)',
      },
    ],
    submitButtonText: 'Создать',
    onSubmit: async (formData) => {
      if (!formData.participantIds?.length) {
        notificationStore.addNotification('Выберите хотя бы одного собеседника', 'error')
        throw new Error('no participants')
      }

      const chat = await chatStore.createNewChat({
        participantIds: formData.participantIds,
        name: formData.name,
      })
      await chatStore.openChat(chat.id)
    },
  })
}

// SSE-соединение теперь держится на уровне App.vue (см. там) — живёт весь
// сеанс, а не только пока открыта эта страница, поэтому чат, оставшийся
// активным после ухода со страницы, уже получал все события по сообщениям
// live и отдельно перезапрашивать его тут не нужно.
// ?open=<chatId> — глубокая ссылка на конкретный чат (используется, например,
// VK-уведомлениями, см. internal/vk/service.go на бэке).
onMounted(async () => {
  await chatStore.loadChats()
  if (route.query.open) {
    chatStore.openChat(route.query.open)
  }
})

// Открытый чат — состояние страницы, а не сессии: закрываем при уходе,
// чтобы при повторном заходе список открывался без выбранного чата (а не с
// тем, что был открыт в прошлый раз). Переход по клику на уведомление
// (goToChat → openChat, потом навигация сюда) это не задевает — chatId
// выставляется ДО монтирования этой страницы, а не после.
onUnmounted(() => {
  chatStore.closeChat()
})
</script>

<style scoped>
.chat-page {
  display: grid;
  grid-template-columns: 22rem 1fr;
  gap: calc(var(--padding-secondary) / 2);
  /* height: 100% тут ни от чего не отталкивается — ни один предок (#app,
     .container, .main из MainLayout.vue) не имеет собственной définite-
     высоты, только min-height: 100vh (эти страницы по умолчанию просто
     растут и скроллится вся страница). Поэтому вместо процента считаем
     высоту прямо от вьюпорта: 100vh минус хедер и вертикальные паддинги
     .main (var(--padding-primary) сверху и снизу). У /chats нет сабменю,
     иначе его высоту тоже нужно было бы вычесть. */
  height: calc(100vh - var(--header-height) - var(--padding-primary) * 2);
  min-height: 0;
}

@media (max-width: 768px) {
  .chat-page {
    grid-template-columns: 1fr;
  }
}
</style>
