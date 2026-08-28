<template>
  <div class="news-settings">
    <AppTable :headers="headers" :rows="items" :loading="isLoading" row-key="id">
      <template #toolbar>
        <div class="settings-title">Новости</div>
        <div class="spacer"></div>
        <ButtonUI @click="openCreateModal">Добавить новость</ButtonUI>
      </template>

      <template #cell-createdAt="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #actions="{ row }">
        <ButtonUI type="muted" icon="fa-regular fa-pen" @click="openEditModal(row)" />
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { createNewsPost, deleteNewsPost, updateNewsPost } from '@/services/news.api'
import { useUniversalModalStore } from '@/stores/modal'
import { useNewsStore } from '@/stores/news'
import { useNotificationStore } from '@/stores/notification'
import { computed, onMounted } from 'vue'

const newsStore = useNewsStore()
const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

const items = computed(() => newsStore.items)
const isLoading = computed(() => newsStore.isLoading)

const headers = [
  { valueKey: 'title', title: 'Заголовок' },
  { valueKey: 'body', title: 'Текст' },
  { valueKey: 'createdAt', title: 'Дата' },
]

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('ru-RU')
}

// Бэк возвращает текст ошибки в { error: "..." } (см. internal/response) —
// на конфликт имени отдельного тоста в api.js нет (тот перехватывает
// только 401/403), показываем сами.
function errorMessage(err, fallback) {
  return err?.response?.data?.error ?? fallback
}

function fieldsFor(post) {
  return [
    { name: 'title', type: 'text', label: 'Заголовок', required: true, value: post?.title ?? '' },
    { name: 'body', type: 'textarea', label: 'Текст', required: true, value: post?.body ?? '' },
  ]
}

function openCreateModal() {
  modalStore.open({
    title: 'Новая новость',
    submitButtonText: 'Опубликовать',
    submittingText: 'Публикация...',
    fields: fieldsFor(null),
    onSubmit: async (data) => {
      try {
        await createNewsPost(data)
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось опубликовать новость'), 'error')
        throw err
      }
      notificationStore.addNotification('Новость опубликована', 'success')
      await newsStore.load()
    },
  })
}

function openEditModal(post) {
  modalStore.open({
    title: 'Новость',
    submitButtonText: 'Сохранить',
    submittingText: 'Сохранение...',
    showDeleteButton: true,
    deleteButtonText: 'Удалить',
    deletingText: 'Удаление...',
    fields: fieldsFor(post),
    onSubmit: async (data) => {
      try {
        await updateNewsPost(post.id, data)
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось сохранить новость'), 'error')
        throw err
      }
      notificationStore.addNotification('Новость сохранена', 'success')
      await newsStore.load()
    },
    onDelete: async () => {
      try {
        await deleteNewsPost(post.id)
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось удалить новость'), 'error')
        throw err
      }
      notificationStore.addNotification('Новость удалена', 'success')
      await newsStore.load()
    },
  })
}

onMounted(() => newsStore.load())
</script>

<style scoped>
.news-settings {
  display: flex;
  flex-direction: column;
  gap: var(--gap-primary);
}

.settings-title {
  display: flex;
  align-items: center;
  font-size: 1.14rem;
  font-weight: 600;
  color: var(--text);
}

.spacer {
  flex: 1;
}
</style>
