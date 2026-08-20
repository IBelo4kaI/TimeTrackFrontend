<template>
  <LoaderPage v-if="userStore.isLoading" />
  <template v-else-if="userStore.isLogin">
    <!-- Страницы с meta.layout === 'full' (например, полноэкранный просмотр
    файла) рендерятся без сайдбара/шапки/сабменю — сами занимают весь экран. -->
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="route.meta.layout === 'full'" />
      <MainLayout v-else>
        <component :is="Component" />
      </MainLayout>
    </RouterView>
    <NotificationContainer />
    <Modal />
  </template>
</template>
<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import LoaderPage from './components/Loader/LoaderPage.vue'
import Modal from './components/Modal.vue'
import NotificationContainer from './components/Notification/NotificationContainer.vue'
import MainLayout from './layouts/MainLayout.vue'
import { useChatStore } from './stores/chat'
import { useDayTypesStore } from './stores/dayTypes'
import { useThemeStore } from './stores/themes'
import { useUserStore } from './stores/user'

const route = useRoute()

const themeStore = useThemeStore()
themeStore.initTheme()

const userStore = useUserStore()
userStore.initialFetch()

const dayTypesStore = useDayTypesStore()
dayTypesStore.load()

// SSE-подключение чатов — тут, а не на странице /chats, чтобы уведомления о
// новых сообщениях/чатах приходили независимо от того, какая страница
// открыта (раньше подключались/отключались вместе со страницей чатов —
// значит, ничего не приходило, пока пользователь был не на ней). Список
// чатов тоже грузим сразу — иначе бейдж непрочитанных в сайдбаре (см.
// Sidebar.vue/chatStore.totalUnread) считать не из чего, пока пользователь
// сам не зайдёт на /chats хотя бы раз за сессию.
const chatStore = useChatStore()
watch(
  () => userStore.isLogin,
  (loggedIn) => {
    if (loggedIn) {
      chatStore.connect()
      chatStore.loadChats()
    } else {
      chatStore.disconnect()
    }
  },
  { immediate: true }
)

const onResize = () => {
  themeStore.isMobile = document.documentElement.clientWidth <= 768
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chatStore.disconnect()
})
</script>
<style scoped></style>
