<template>
  <div class="container" :class="{ 'sidebar-open': isSidebarOpen, 'report-layout': route.name === 'report', 'calendar-layout': route.name === 'calendar' }">
    <Sidebar
      :is-sidebar-open="isSidebarOpen"
      @update:is-sidebar-open="isSidebarOpen = $event"
    />

    <!-- Overlay -->
    <Transition name="overlay">
      <div v-if="isSidebarOpen" class="sidebar-overlay" @click="closeSidebar" />
    </Transition>

    <Header @toggle-sidebar="toggleSidebar" />

    <div class="main"><slot></slot></div>
  </div>
</template>

<script setup>
import Header from '@/components/Layout/Header.vue'
import Sidebar from '@/components/Layout/Sidebar.vue'
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
    'sidebar main';
  grid-template-rows: var(--header-height) 1fr;
  grid-template-columns: var(--sidebar-width) 1fr;
}

/* The report table must not set the grid track's minimum width. */
.report-layout { min-width: 0; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); }
.report-layout > .main { min-width: 0; }

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

@media screen and (min-width: 769px) {
  .calendar-layout {
    min-height: 100dvh;
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  }
  .calendar-layout > .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
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
