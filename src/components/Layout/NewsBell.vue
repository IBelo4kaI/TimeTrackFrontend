<template>
  <div class="news-bell" ref="wrapperRef">
    <button type="button" class="bell-btn" v-tooltip="'Новости'" @click="toggleOpen">
      <i class="fa-regular fa-bullhorn"></i>
      <span v-if="store.unreadCount > 0" class="bell-badge">
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </button>

    <Transition name="panel-fade">
      <div v-if="open" class="news-panel">
        <div class="news-panel__header">
          <span>Новости</span>
        </div>

        <LoaderTitle v-if="store.isLoading" />

        <div v-else-if="!store.items.length" class="news-panel__empty">
          <i class="fa-regular fa-bullhorn"></i>
          <span>Пока пусто</span>
        </div>

        <div v-else class="news-panel__list">
          <div v-for="item in store.items" :key="item.id" class="news-item">
            <span class="news-item__title">{{ item.title }}</span>
            <span class="news-item__body">{{ item.body }}</span>
            <span class="news-item__time">{{ formatDateTime(item.createdAt) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { useNewsStore } from '@/stores/news'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const store = useNewsStore()

const open = ref(false)
const wrapperRef = ref(null)

function formatDateTime(createdAt) {
  if (!createdAt) return ''
  return new Date(createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    store.load()
    store.markSeen()
  }
}

function onClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped>
.news-bell {
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

.news-panel {
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

.news-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}

.news-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.57rem;
  padding: 2.86rem 1rem;
  color: var(--muted-text);
  font-size: 0.93rem;
}

.news-panel__empty i {
  font-size: 1.71rem;
}

.news-panel__list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.news-item {
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
  padding: 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
}

.news-item:last-child {
  border-bottom: none;
}

.news-item__title {
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--text);
}

.news-item__body {
  font-size: 0.86rem;
  color: var(--muted-text);
  white-space: pre-line;
}

.news-item__time {
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
