<template>
  <div class="container" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- Overlay -->
    <Transition name="overlay">
      <div v-if="isSidebarOpen" class="sidebar-overlay" @click="closeSidebar" />
    </Transition>

    <div class="sidebar">
      <div class="sidebar-title">
        <Info
          info-title="Time track"
          info-type="type-title"
          info-content="Учет времени"
          info-icon-class="fa-light fa-clock"
          info-icon-style="icon-accent"
        />
        <!-- Кнопка закрытия внутри сайдбара (мобилка) -->
        <button
          class="sidebar-close-btn"
          @click="closeSidebar"
          aria-label="Закрыть меню"
        >
          <i class="fa-light fa-xmark" />
        </button>
      </div>
      <div class="sidebar-nav">
        <NavItem
          v-for="item in routesNavigation"
          :key="item.name"
          :icon="item.meta.icon"
          :title="item.meta.title"
          :to="item.name"
          :meta="item.meta"
          @click="closeSidebar"
        />
      </div>
    </div>

    <div class="header">
      <!-- Кнопка бургера (мобилка) -->
      <button
        class="burger-btn"
        @click="toggleSidebar"
        aria-label="Открыть меню"
      >
        <i class="fa-regular fa-bars" />
      </button>

      <Info
        class="header-title"
        info-type="type-title"
        :info-title="title"
        :info-content="desc"
      />
      <div class="header-theme">
        <ToggleTheme />
      </div>
      <div class="header-notify">
        <!-- <Notification></Notification> -->
      </div>
      <Profile :icon="userStore.userInitials" :title="userStore.userFullName" />
    </div>

    <div class="main"><slot></slot></div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
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

const isSidebarOpen = ref(false)
const route = useRoute()

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function closeSidebar() {
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
    'sidebar main';
  grid-template-rows: var(--header-height) 1fr;
  grid-template-columns: var(--sidebar-width) 1fr;
}

/* ─── Sidebar ─── */
.sidebar {
  grid-area: sidebar;
  position: fixed;
  top: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--foreground);
  border-right: 0.07rem solid var(--border-color);
  z-index: 100;
}

.sidebar-title {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0.36rem 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
}

.sidebar-close-btn {
  display: none;
  margin-left: auto;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  color: var(--text-secondary, #888);
  font-size: 1.1rem;
  line-height: 1;
  border-radius: 0.25rem;
  transition:
    color 0.15s,
    background 0.15s;
}

.sidebar-close-btn:hover {
  color: var(--text-primary, #333);
  background: var(--background-hover, rgba(0, 0, 0, 0.06));
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  padding: var(--padding-primary) 0.71rem;
}

/* ─── Header ─── */
.header {
  grid-area: header;
  display: flex;
  align-items: center;
  gap: 0.36rem;
  justify-content: space-between;
  padding: 0.36rem 0.71rem;
  background: var(--foreground);
  border-bottom: 0.0714rem solid var(--border-color);
  height: var(--header-height);
}

.header-title {
  flex: 1;
}

.header-profile {
  cursor: pointer;
}

.burger-btn {
  display: none;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  color: var(--text-secondary, #888);
  font-size: 1.5rem;
  line-height: 1;
  border-radius: 0.25rem;
  transition:
    color 0.15s,
    background 0.15s;
}

.burger-btn:hover {
  color: var(--text-primary, #333);
  background: var(--background-hover, rgba(0, 0, 0, 0.06));
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

  .burger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar-overlay {
    display: block;
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

  .main {
    flex: 1;
  }
}

/* ─── Print ─── */
@media print {
  .sidebar,
  .header {
    display: none !important;
  }

  .container {
    display: block;
  }

  .main {
    padding: 0;
  }
}
</style>
