<template>
  <LoaderPage v-if="userStore.isLoading" />
  <template v-else-if="userStore.isLogin">
    <template v-if="!isMobile">
      <MainLayout>
        <RouterView></RouterView>
      </MainLayout>
      <NotificationContainer />
    </template>
    <template v-else>
      <MobileLayout>
        <RouterView></RouterView>
      </MobileLayout>
      <NotificationContainer />
    </template>
    <Modal />
  </template>
</template>
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import LoaderPage from './components/Loader/LoaderPage.vue'
import Modal from './components/Modal.vue'
import NotificationContainer from './components/Notification/NotificationContainer.vue'
import MainLayout from './layouts/MainLayout.vue'
import MobileLayout from './layouts/MobileLayout.vue'
import { useDayTypesStore } from './stores/dayTypes'
import { useThemeStore } from './stores/themes'
import { useUserStore } from './stores/user'

const themeStore = useThemeStore()
themeStore.initTheme()

const userStore = useUserStore()
userStore.initialFetch()

const dayTypesStore = useDayTypesStore()
dayTypesStore.load()

const isMobile = ref(document.documentElement.clientWidth <= 768)

const onResize = () => {
  isMobile.value = document.documentElement.clientWidth <= 768
}

onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>
<style scoped></style>
