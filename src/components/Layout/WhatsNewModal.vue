<template>
  <ModalLayout v-if="visible" title="Что нового" @close="onClose">
    <div class="whats-new">
      <div v-for="item in unreadItems" :key="item.id" class="whats-new__item">
        <span class="whats-new__title">{{ item.title }}</span>
        <span class="whats-new__body">{{ item.body }}</span>
      </div>
      <ButtonUI @click="onClose">Понятно</ButtonUI>
    </div>
  </ModalLayout>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import ModalLayout from '@/layouts/ModalLayout.vue'
import { useNewsStore } from '@/stores/news'
import { useUserStore } from '@/stores/user'
import { ref, watch } from 'vue'

const store = useNewsStore()
const userStore = useUserStore()

const visible = ref(false)
const unreadItems = ref([])

watch(
  () => userStore.isLogin,
  async (loggedIn) => {
    if (!loggedIn) return
    await store.loadUnreadCount()
    if (store.unreadCount === 0) return

    await store.load()
    unreadItems.value = store.items.slice(0, store.unreadCount)
    visible.value = true
  },
  { immediate: true }
)

function onClose() {
  visible.value = false
  store.markSeen()
}
</script>

<style scoped>
.whats-new {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
}

.whats-new__item {
  display: flex;
  flex-direction: column;
  gap: 0.29rem;
  padding-bottom: 0.86rem;
  border-bottom: 0.07rem solid var(--border-color);
}

.whats-new__item:last-of-type {
  border-bottom: none;
}

.whats-new__title {
  font-weight: 600;
  color: var(--text);
}

.whats-new__body {
  font-size: 0.93rem;
  color: var(--muted-text);
  white-space: pre-line;
}
</style>
