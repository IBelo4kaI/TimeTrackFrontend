<template>
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
</template>

<script setup>
import { routesNavigation } from '@/router'
import Info from '../Info.vue'
import NavItem from '../NavItem.vue'

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
}

@media print {
  .sidebar {
    display: none !important;
  }
}
</style>
