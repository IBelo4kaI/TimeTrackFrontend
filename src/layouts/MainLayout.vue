<template>
  <div class="container" :class="{ 'sidebar-open': isSidebarOpen }">
    <Sidebar
      :is-sidebar-open="isSidebarOpen"
      @update:is-sidebar-open="isSidebarOpen = $event"
    />

    <!-- Overlay -->
    <Transition name="overlay">
      <div v-if="isSidebarOpen" class="sidebar-overlay" @click="closeSidebar" />
    </Transition>

    <Header @toggle-sidebar="toggleSidebar" />

    <Submenu />

    <div class="main"><slot></slot></div>
  </div>
</template>

<script setup>
import Header from '@/components/Layout/Header.vue'
import Sidebar from '@/components/Layout/Sidebar.vue'
import Submenu from '@/components/Layout/Submenu.vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const isSidebarOpen = ref(false)
const route = useRoute()

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

// Закрывать при смене роута
watch(() => route.path, closeSidebar)

// Блокировать скролл body когда сайдбар открыт
watch(isSidebarOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})
</script>

<style scoped>
.container {
  flex: 1;
  display: grid;
  grid-template-areas:
    'sidebar header'
    'sidebar submenu'
    'sidebar main';
  grid-template-rows: var(--header-height) auto 1fr;
  grid-template-columns: var(--sidebar-width) 1fr;
}

/* ─── Submenu ─── */
.submenu {
  grid-area: submenu;
}

/* ─── Main ─── */
.main {
  grid-area: main;
  padding: var(--padding-primary);
}

/* ─── Overlay ─── */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 99;
  touch-action: none;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* ─── Mobile ─── */
@media (max-width: 768px) {
  .container {
    display: flex;
    flex-direction: column;
    grid-template-areas: none;
  }

  .sidebar-overlay {
    display: block;
  }

  .main {
    flex: 1;
  }
}

/* ─── Print ─── */
@media print {
  .container {
    display: block;
  }

  .main {
    padding: 0;
  }
}
</style>
