<template>
  <div class="container">
    <div class="header">
      <Info
        class="header-title"
        info-type="type-title"
        :info-title="title"
        :info-content="desc"
      />
      <div class="header-theme">
        <ToggleTheme />
      </div>
      <Profile :icon="userStore.userInitials" :title="userStore.userFullName" />
    </div>
    <div class="main"><slot></slot></div>
    <div class="menu">
      <template v-for="item in routesNavigation">
        <NavItem
          v-if="item.meta.onMobile"
          :icon="item.meta.icon"
          :title="item.meta.title"
          :to="item.name"
          :meta="item.meta"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import Info from '@/components/Info.vue'
import NavItem from '@/components/NavItem.vue'
import Profile from '@/components/Profile.vue'
import ToggleTheme from '@/components/ToggleTheme.vue'
import { routesNavigation } from '@/router'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const titleStore = useHeaderTitleStore()
const { title, desc } = storeToRefs(titleStore)

const userStore = useUserStore()
</script>

<style scoped>
.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}
.header-title {
  flex: 1;
}
.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 0.36rem;
  justify-content: space-between;
  padding: 0.36rem 0.71rem;
  background: var(--foreground);
  border-bottom: 0.0714rem solid var(--border-color);
}

.main {
  flex: 1;
  overflow: auto;
  padding: var(--padding-secondary);
}

.menu {
  /* height: var(--header-height); */
  padding: 0.36rem 0.71rem;
  background: var(--foreground);
  border-top: 0.0714rem solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
