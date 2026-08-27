<template>
  <div class="notification-bell" ref="wrapperRef">
    <button type="button" class="bell-btn" @click="toggleOpen">
      <i class="fa-regular fa-bell"></i>
      <span v-if="store.unreadCount > 0" class="bell-badge">
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </button>

    <Transition name="panel-fade">
      <div v-if="open" class="notification-panel">
        <div class="notification-panel__header">
          <span>Уведомления</span>
          <button
            v-if="store.unreadCount > 0"
            type="button"
            class="notification-panel__mark-all"
            @click="store.markAllRead"
          >
            Прочитать все
          </button>
        </div>

        <LoaderTitle v-if="store.isLoading" />

        <div v-else-if="!store.items.length" class="notification-panel__empty">
          <i class="fa-regular fa-bell-slash"></i>
          <span>Пока пусто</span>
        </div>

        <div v-else class="notification-panel__list">
          <component
            :is="linkFor(item) ? 'RouterLink' : 'div'"
            v-for="item in store.items"
            :key="item.id"
            :to="linkFor(item) ?? undefined"
            class="notification-item"
            :class="{ 'notification-item--unread': !isRead(item) }"
            @click="onItemClick(item)"
          >
            <span class="notification-item__dot" v-if="!isRead(item)"></span>
            <div class="notification-item__body">
              <span class="notification-item__title">{{ item.title }}</span>
              <span class="notification-item__message">{{ item.message }}</span>
              <span class="notification-item__time">{{ formatDateTime(item.createdAt) }}</span>
            </div>
          </component>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { useNotificationCenterStore } from '@/stores/notificationCenter'
import { unwrapNull } from '@/utils/chat.utils'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const store = useNotificationCenterStore()
const linkFor = store.linkFor

const open = ref(false)
const wrapperRef = ref(null)

function isRead(item) {
  return !!unwrapNull(item.isRead, 'Bool')
}

// createdAt — обычная ISO-строка (не sql.NullTime-обёртка): колонка
// notifications.created_at теперь DATETIME NOT NULL, см. бэк
// 018_notification_timestamp_utc.sql (тот же фикс, что раньше для чата).
function formatDateTime(createdAt) {
  if (!createdAt) return ''
  return new Date(createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function onItemClick(item) {
  store.markRead(item.id)
  open.value = false
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) store.load()
}

function onClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  store.loadUnreadCount()
  document.addEventListener('mousedown', onClickOutside)
  // SSE-подключение (App.vue) держит бейдж/список в реальном времени —
  // поллинг тут больше не нужен.
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.57rem;
  height: 2.57rem;
  background: none;
  border: none;
  border-radius: var(--border-radius);
  color: var(--muted-text);
  font-size: 1.14rem;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.bell-btn:hover {
  background: var(--background);
  color: var(--text);
}

.bell-badge {
  position: absolute;
  top: 0.29rem;
  right: 0.29rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.07rem;
  height: 1.07rem;
  padding: 0 0.29rem;
  border-radius: 1rem;
  background: var(--destructive);
  color: #fff;
  font-size: 0.64rem;
  font-weight: 700;
}

.notification-panel {
  position: absolute;
  top: calc(100% + 0.43rem);
  right: 0;
  width: 22rem;
  max-height: 28rem;
  display: flex;
  flex-direction: column;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 200;
  overflow: hidden;
}

.notification-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}

.notification-panel__mark-all {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.79rem;
  font-weight: 500;
  cursor: pointer;
}

.notification-panel__mark-all:hover {
  text-decoration: underline;
}

.notification-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.57rem;
  padding: 2.86rem 1rem;
  color: var(--muted-text);
  font-size: 0.93rem;
}

.notification-panel__empty i {
  font-size: 1.71rem;
}

.notification-panel__list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 0.57rem;
  padding: 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: var(--background);
}

.notification-item--unread {
  background: var(--muted-accent);
}

.notification-item--unread:hover {
  background: var(--muted-accent);
  filter: brightness(0.97);
}

.notification-item__dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.4rem;
  border-radius: 50%;
  background: var(--accent);
}

.notification-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
}

.notification-item__title {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text);
}

.notification-item__message {
  font-size: 0.86rem;
  color: var(--muted-text);
  /* pre-line — переносы строк в тексте (дата/тип/описание, см.
     vacationNotificationBody на бэке) сохраняются, а не схлопываются в
     одну строку. */
  white-space: pre-line;
}

.notification-item__time {
  font-size: 0.71rem;
  color: var(--muted-text);
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
