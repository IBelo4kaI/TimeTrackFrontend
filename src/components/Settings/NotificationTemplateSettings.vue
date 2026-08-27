<template>
  <div class="template-settings">
    <AppTable :headers="headers" :rows="items" :loading="isLoading" row-key="id">
      <template #toolbar>
        <div class="settings-title">Шаблоны уведомлений</div>
        <div class="spacer"></div>
        <ButtonUI @click="openCreateModal">Добавить шаблон</ButtonUI>
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
import {
  createNotificationTemplate,
  deleteNotificationTemplate,
  getNotificationTemplates,
  updateNotificationTemplate,
} from '@/services/notificationTemplates.api'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { onMounted, ref } from 'vue'

const items = ref([])
const isLoading = ref(false)

const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

const headers = [
  { valueKey: 'name', title: 'Название' },
  { valueKey: 'title', title: 'Заголовок' },
  { valueKey: 'message', title: 'Текст' },
]

async function loadItems() {
  isLoading.value = true
  try {
    items.value = (await getNotificationTemplates()) ?? []
  } catch {
    notificationStore.addNotification('Не удалось загрузить шаблоны', 'error')
    items.value = []
  } finally {
    isLoading.value = false
  }
}

// Бэк возвращает текст ошибки в { error: "..." } (см. internal/response) —
// на конфликт имени отдельного тоста в api.js нет (тот перехватывает
// только 401/403), показываем сами.
function errorMessage(err, fallback) {
  return err?.response?.data?.error ?? fallback
}

function fieldsFor(template) {
  return [
    { name: 'name', type: 'text', label: 'Название шаблона', required: true, value: template?.name ?? '' },
    { name: 'title', type: 'text', label: 'Заголовок уведомления', required: true, value: template?.title ?? '' },
    { name: 'message', type: 'textarea', label: 'Текст уведомления', value: template?.message ?? '' },
  ]
}

function openCreateModal() {
  modalStore.open({
    title: 'Новый шаблон',
    submitButtonText: 'Создать',
    submittingText: 'Создание...',
    fields: fieldsFor(null),
    onSubmit: async (data) => {
      try {
        await createNotificationTemplate(data)
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось создать шаблон'), 'error')
        throw err
      }
      notificationStore.addNotification('Шаблон создан', 'success')
      await loadItems()
    },
  })
}

function openEditModal(template) {
  modalStore.open({
    title: 'Шаблон уведомления',
    submitButtonText: 'Сохранить',
    submittingText: 'Сохранение...',
    showDeleteButton: true,
    deleteButtonText: 'Удалить',
    deletingText: 'Удаление...',
    fields: fieldsFor(template),
    onSubmit: async (data) => {
      try {
        await updateNotificationTemplate(template.id, data)
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось сохранить шаблон'), 'error')
        throw err
      }
      notificationStore.addNotification('Шаблон сохранён', 'success')
      await loadItems()
    },
    onDelete: async () => {
      try {
        await deleteNotificationTemplate(template.id)
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось удалить шаблон'), 'error')
        throw err
      }
      notificationStore.addNotification('Шаблон удалён', 'success')
      await loadItems()
    },
  })
}

onMounted(loadItems)
</script>

<style scoped>
.template-settings {
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
