<template>
  <div class="header">
    <!-- Кнопка бургера (мобилка) -->
    <button
      class="burger-btn"
      @click="emit('toggle-sidebar')"
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
      <NewsBell />
      <NotificationBell />
    </div>
    <Profile :icon="userStore.userInitials" :title="userStore.userFullName" />
  </div>
</template>

<script setup>
import Info from '../Info.vue'
import NewsBell from './NewsBell.vue'
import NotificationBell from './NotificationBell.vue'
import Profile from '../Profile.vue'
import ToggleTheme from '../ToggleTheme.vue'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const titleStore = useHeaderTitleStore()
const { title, desc } = storeToRefs(titleStore)

const userStore = useUserStore()

const emit = defineEmits(['toggle-sidebar'])
</script>

<style scoped>
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

.header-notify {
  display: flex;
  align-items: center;
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

@media (max-width: 768px) {
  .burger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media print {
  .header {
    display: none !important;
  }
}
</style>
