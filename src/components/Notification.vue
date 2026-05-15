<template>
  <div class="notification-button">
    <ButtonUI type="muted" icon="fa-regular fa-bell" @click="isOpen = !isOpen"></ButtonUI>
  </div>
  <Teleport to="body">
    <Transition name="notify-fade">
      <div v-if="isOpen" class="notification-container">
        <div class="notification-header">
          <Tabs
            :tabs="targets"
            v-model="notifyMode"
            type="accent-no-background"
            style="width: 100%"
          />
          <ButtonUI
            v-if="unreadItems.length"
            type="muted"
            size="sm"
            v-tooltip="'Отметить все прочитанными'"
            icon="fa-regular fa-check-double"
            @click="markAllRead"
          />
        </div>

        <div class="notification-list">
          <template v-if="visibleItems.length">
            <div
              v-for="item in visibleItems"
              :key="item.id"
              class="notification-item"
              :class="{ unread: !item.isRead }"
              @click="onItemClick(item)"
            >
              <div class="notification-item-icon">
                <i :class="getIcon(item.entityType)" />
              </div>
              <div class="notification-item-body">
                <div class="notification-item-title">{{ item.title }}</div>
                <div class="notification-item-message">{{ item.message }}</div>
                <div class="notification-item-time">
                  {{ formatTime(item.createdAt) }}
                </div>
              </div>
              <div v-if="!item.isRead" class="notification-item-dot" />
            </div>
          </template>
          <div v-else class="notification-empty">
            <i class="fa-regular fa-bell-slash" />
            <span>
              {{
                notifyMode === 'new'
                  ? 'Нет новых уведомлений'
                  : 'Нет прочитанных'
              }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Tabs from './Tabs.vue'
import ButtonUI from './ButtonUI.vue'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const isOpen = ref(false)

const notifyMode = ref('new')
const notificationStore = useNotificationStore()
const userStore = useUserStore()
const router = useRouter()

const targets = [
  { id: 'new', label: 'Новые' },
  { id: 'old', label: 'Прочитанные' },
]

const unreadItems = computed(() =>
  (notificationStore.items ?? []).filter((n) => !n.isRead)
)

const visibleItems = computed(() =>
  (notificationStore.items ?? []).filter((n) =>
    notifyMode.value === 'new' ? !n.isRead : n.isRead
  )
)

function getIcon(entityType) {
  const map = {
    vacation: 'fa-regular fa-umbrella-beach',
    default: 'fa-regular fa-bell',
  }
  return map[entityType] ?? map.default
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  return d.toLocaleDateString('ru-RU')
}

async function markAllRead() {
  await notificationStore.markAllRead()
}

async function onItemClick(item) {
  if (!item.isRead) {
    await notificationStore.markRead(item.id)
  }
  if (item.entityType === 'vacation' && item.entityId) {
    router.push({ name: 'vacations', query: { highlight: item.entityId } })
    isOpen.value = false
  }
}

// закрытие по клику вне
function onClickOutside(e) {
  if (
    !e.target.closest('.notification-button') &&
    !e.target.closest('.notification-container')
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  notificationStore.fetchNotifications()
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped>
.notification-container {
  position: absolute;
  width: 24rem;
  top: calc(var(--header-height) + var(--padding-secondary));
  right: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  overflow: hidden;
  z-index: 1000;
}

.notification-header {
  display: flex;
  align-items: center;
  padding: var(--padding-secondary) var(--padding-secondary) 0;
  gap: 0.5rem;
}

.notification-list {
  max-height: 26rem;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: calc(var(--border-radius) * 0.75);
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}

.notification-item:hover {
  background: var(--background);
}

.notification-item.unread {
  background: var(--background);
}

.notification-item-icon {
  font-size: 1rem;
  color: var(--accent);
  padding-top: 0.15rem;
  flex-shrink: 0;
}

.notification-item-body {
  flex: 1;
  min-width: 0;
}

.notification-item-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-item-message {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
  line-height: 1.4;
}

.notification-item-time {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.notification-item-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  margin-top: 0.35rem;
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.notification-empty i {
  font-size: 1.5rem;
}

.notify-fade-enter-active,
.notify-fade-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.notify-fade-enter-from,
.notify-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

:deep(.tabs-item) {
  flex: 1;
  justify-content: center;
}
</style>
