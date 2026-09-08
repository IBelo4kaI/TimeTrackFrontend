<template>
  <div class="sidebar">
    <SidebarTitle @close="closeSidebar" />
    <div class="sidebar-nav">
      <NavItem
        v-for="item in routesNavigation"
        :key="item.name"
        :icon="item.meta.icon"
        :title="item.meta.title"
        :to="item.name"
        :meta="item.meta"
        :badge="item.name === 'chats' ? chatStore.totalUnread : 0"
        @click="closeSidebar"
      />
    </div>

    <!-- Переключатель темы — на десктопе живёт в шапке, сюда переезжает
    только на мобилке (см. media query ниже), без JS-детекта ширины. -->
    <div class="sidebar-theme">
      <ToggleTheme />
    </div>
  </div>
</template>

<script setup>
import { routesNavigation } from '@/router'
import { useChatStore } from '@/stores/chat'
import Info from '../Info.vue'
import NavItem from '../NavItem.vue'
import ToggleTheme from '../ToggleTheme.vue'
import SidebarTitle from './SidebarTitle.vue'

const chatStore = useChatStore()
const emits = defineEmits(['update:isSidebarOpen'])

function closeSidebar() {
  emits('update:isSidebarOpen', false)
}
</script>

<style scoped>
.sidebar {
  grid-area: sidebar;
  position: fixed;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  background: var(--foreground);
  border-right: 0.07rem solid var(--border-color);
  z-index: 100;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  padding: var(--padding-primary) 0.71rem;
}

.sidebar-theme {
  display: none;
  margin-top: auto;
  padding: 0.71rem;
  border-top: 0.07rem solid var(--border-color);
}

@media (max-width: 768px) {
  .sidebar-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    /* перекрываем overlay */
    z-index: 100;
  }

  .container.sidebar-open .sidebar {
    transform: translateX(0);
  }

  .sidebar-theme {
    display: flex;
    justify-content: center;
  }
}

@media print {
  .sidebar {
    display: none !important;
  }
}
</style>
