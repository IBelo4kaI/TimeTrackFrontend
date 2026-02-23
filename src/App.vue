<template>
  <LoaderPage v-if="userStore.isLoading" />
  <template v-else-if="userStore.isLogin">
    <MainLayout>
      <RouterView></RouterView>
    </MainLayout>
    <NotificationContainer />
    <Modal />
  </template>
</template>
<script setup>
import { RouterView } from 'vue-router'
import LoaderPage from './components/LoaderPage.vue'
import Modal from './components/Modal.vue'
import NotificationContainer from './components/Notification/NotificationContainer.vue'
import MainLayout from './layouts/MainLayout.vue'
import { useDayTypesStore } from './stores/dayTypes'
import { useThemeStore } from './stores/themes'
import { useUserStore } from './stores/user'

const themeStore = useThemeStore()
themeStore.initTheme()

const userStore = useUserStore()
userStore.initialFetch()

const dayTypesStore = useDayTypesStore()
dayTypesStore.load()
</script>
<style scoped></style>
