<template>
  <div class="vacation-type-settings">
    <AppTable :headers="headers" :rows="items" :loading="isLoading" row-key="id">
      <template #toolbar>
        <div class="settings-title">Типы отпусков</div>
        <div class="spacer"></div>
        <ButtonUI @click="openCreateModal">Добавить тип</ButtonUI>
      </template>

      <template #cell-colorCode="{ value }">
        <span class="color-cell">
          <span class="color-swatch" :style="{ background: value }"></span>
          {{ value }}
        </span>
      </template>

      <template #cell-affectsBalance="{ value }">
        <Badge :type="value ? 'success' : 'muted'">{{ value ? 'Да' : 'Нет' }}</Badge>
      </template>

      <template #cell-isActive="{ value }">
        <Badge :type="value ? 'success' : 'muted'">{{ value ? 'Активен' : 'Скрыт' }}</Badge>
      </template>

      <template #actions="{ row }">
        <ButtonUI type="muted" icon="fa-regular fa-pen" @click="openEditModal(row)" />
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import {
  createVacationType,
  deleteVacationType,
  getVacationTypes,
  updateVacationType,
} from '@/services/vacationTypes.api'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { onMounted, ref } from 'vue'

const items = ref([])
const isLoading = ref(false)

const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

const headers = [
  { valueKey: 'sortOrder', title: '#', align: 'right' },
  { valueKey: 'name', title: 'Название' },
  { valueKey: 'systemName', title: 'Системное имя' },
  { valueKey: 'colorCode', title: 'Цвет' },
  { valueKey: 'affectsBalance', title: 'Влияет на баланс' },
  { valueKey: 'isActive', title: 'Статус' },
]

async function loadItems() {
  isLoading.value = true
  try {
    items.value = (await getVacationTypes()) ?? []
  } catch {
    notificationStore.addNotification('Не удалось загрузить типы отпусков', 'error')
    items.value = []
  } finally {
    isLoading.value = false
  }
}

// Бэк возвращает текст ошибки в { error: "..." } (см. internal/response) —
// на конфликт имени/использования типа в заявках отдельного тоста в
// api.js нет (тот перехватывает только 401/403), показываем сами.
function errorMessage(err, fallback) {
  return err?.response?.data?.error ?? fallback
}

function fieldsFor(type) {
  return [
    {
      name: 'name',
      type: 'text',
      label: 'Название',
      required: true,
      value: type?.name ?? '',
    },
    {
      name: 'systemName',
      type: 'text',
      label: 'Системное имя',
      hint: 'Латиницей, без пробелов — используется в коде (например, paid, unpaid)',
      required: true,
      value: type?.systemName ?? '',
    },
    {
      name: 'colorCode',
      type: 'text',
      label: 'Цвет',
      hint: 'В формате #RRGGBB',
      placeholder: '#39c684',
      required: true,
      value: type?.colorCode ?? '#39c684',
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Порядок сортировки',
      value: type?.sortOrder ?? 0,
    },
    {
      name: 'affectsBalance',
      type: 'checkbox',
      label: 'Списывать дни из баланса отпуска',
      value: type?.affectsBalance ?? true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Активен (доступен для выбора при подаче заявки)',
      value: type?.isActive ?? true,
    },
  ]
}

function normalize(data) {
  return {
    name: data.name,
    systemName: data.systemName,
    colorCode: data.colorCode,
    sortOrder: Number(data.sortOrder) || 0,
    affectsBalance: !!data.affectsBalance,
    isActive: !!data.isActive,
  }
}

function openCreateModal() {
  modalStore.open({
    title: 'Новый тип отпуска',
    submitButtonText: 'Создать',
    submittingText: 'Создание...',
    fields: fieldsFor(null),
    onSubmit: async (data) => {
      try {
        await createVacationType(normalize(data))
      } catch (err) {
        notificationStore.addNotification(
          errorMessage(err, 'Не удалось создать тип отпуска'),
          'error'
        )
        throw err
      }
      notificationStore.addNotification('Тип отпуска создан', 'success')
      await loadItems()
    },
  })
}

function openEditModal(type) {
  modalStore.open({
    title: 'Тип отпуска',
    submitButtonText: 'Сохранить',
    submittingText: 'Сохранение...',
    showDeleteButton: true,
    deleteButtonText: 'Удалить',
    deletingText: 'Удаление...',
    fields: fieldsFor(type),
    onSubmit: async (data) => {
      try {
        await updateVacationType(type.id, normalize(data))
      } catch (err) {
        notificationStore.addNotification(
          errorMessage(err, 'Не удалось сохранить тип отпуска'),
          'error'
        )
        throw err
      }
      notificationStore.addNotification('Тип отпуска сохранён', 'success')
      await loadItems()
    },
    onDelete: async () => {
      try {
        await deleteVacationType(type.id)
      } catch (err) {
        notificationStore.addNotification(
          errorMessage(err, 'Не удалось удалить тип отпуска'),
          'error'
        )
        throw err
      }
      notificationStore.addNotification('Тип отпуска удалён', 'success')
      await loadItems()
    },
  })
}

onMounted(loadItems)
</script>

<style scoped>
.vacation-type-settings {
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

.color-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.color-swatch {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 0.29rem;
  border: 0.07rem solid var(--border-color);
  flex-shrink: 0;
}
</style>
