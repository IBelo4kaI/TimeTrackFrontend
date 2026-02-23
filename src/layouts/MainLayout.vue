<template>
  <div class="container">
    <div class="sidebar">
      <div class="sidebar-title">
        <Info
          info-title="Time track"
          info-type="type-title"
          info-content="Учет времени"
          info-icon-class="fa-light fa-clock"
          info-icon-style="icon-accent"
        />
      </div>
      <div class="sidebar-nav">
        <NavItem
          v-for="item in routesNavigation"
          :icon="item.meta.icon"
          :title="item.meta.title"
          :to="item.name"
          :meta="item.meta"
        />
      </div>
    </div>
    <div class="header">
      <Info
        class="header-title"
        info-type="type-title"
        :info-title="title"
        :info-content="desc"
      />
      <div class="header-theme">
        <ButtonUI @click="themeStore.toggleTheme">Сменить тему</ButtonUI>
      </div>
      <div class="header-notify"></div>
      <Profile :icon="userInitials" :title="userFullName" />
    </div>
    <div class="main"><slot></slot></div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import Info from '@/components/Info.vue'
import NavItem from '@/components/NavItem.vue'
import Profile from '@/components/Profile.vue'
import { routesNavigation } from '@/router'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useThemeStore } from '@/stores/themes'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const titleStore = useHeaderTitleStore()
const { title, desc } = storeToRefs(titleStore)

const themeStore = useThemeStore()

const userStore = useUserStore()

const userFullName = computed(() => {
  console.log(userStore.user)
  const user = userStore.user
  return [user.name, user.surname].join(' ')
})

const userInitials = computed(() => {
  console.log(userStore.user)
  const user = userStore.user

  return [user.name.charAt(0), user.surname.charAt(0)].join('')
})
</script>

<style scoped>
.container {
  flex: 1;
  display: grid;
  grid-template-areas:
    'sidebar header'
    'sidebar main';
  grid-template-rows: var(--header-height) 1fr;
  grid-template-columns: var(--sidebar-width) 1fr;
}
.sidebar {
  grid-area: sidebar;
  position: fixed;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--foreground);
  border-right: 0.07rem solid var(--border-color);
}
.sidebar-title {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0.36rem 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  padding: var(--padding-primary) 0.71rem;
}

.header {
  grid-area: header;
  display: flex;
  align-items: center;
  gap: 0.36rem;
  justify-content: space-between;
  padding: 0.36rem 0.71rem;
  background: var(--foreground);
  border-bottom: 0.0714rem solid var(--border-color);
}
.header-title {
  flex: 1;
}
.header-profile {
  cursor: pointer;
}
.main {
  grid-area: main;
  padding: var(--padding-primary);
}
</style>
