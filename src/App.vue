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
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import LoaderPage from './components/Loader/LoaderPage.vue'
import Modal from './components/Modal.vue'
import NotificationContainer from './components/Notification/NotificationContainer.vue'
import MainLayout from './layouts/MainLayout.vue'
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

const onResize = () => {
  themeStore.isMobile = document.documentElement.clientWidth <= 768
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>
<style scoped></style>
