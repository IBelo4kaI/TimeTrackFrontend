<template>
  <div class="day-type-settings">
    <AppTable :headers="headers" :rows="items" :loading="isLoading" row-key="id">
      <template #toolbar>
        <div class="settings-title">Типы дней</div>
        <div class="spacer"></div>
        <ButtonUI @click="openCreateModal">Добавить тип</ButtonUI>
      </template>

      <template #cell-colorCode="{ value }">
        <span class="color-cell">
          <span class="color-swatch" :style="{ background: value }"></span>
          {{ value }}
        </span>
      </template>

      <template #cell-isWorkDay="{ value }">
        <Badge :type="value ? 'success' : 'muted'">{{ value ? 'Рабочий' : 'Нерабочий' }}</Badge>
      </template>

      <template #cell-affectsVacation="{ value }">
        <Badge :type="value ? 'success' : 'muted'">{{ value ? 'Да' : 'Нет' }}</Badge>
      </template>

      <template #cell-isUserSelect="{ value }">
        <Badge :type="value ? 'success' : 'muted'">{{ value ? 'Да' : 'Нет' }}</Badge>
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
import { createDayType, deleteDayType, updateDayType } from '@/services/dayTypes.api'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { computed, onMounted, ref } from 'vue'

const dayTypesStore = useDayTypesStore()
const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

const isLoading = ref(false)
const items = computed(() => Array.from(dayTypesStore.dayTypes.values()))

const headers = [
  { valueKey: 'name', title: 'Название' },
  { valueKey: 'systemName', title: 'Системное имя' },
  { valueKey: 'colorCode', title: 'Цвет' },
  { valueKey: 'isWorkDay', title: 'Рабочий день' },
  { valueKey: 'affectsVacation', title: 'Влияет на отпуск' },
  { valueKey: 'isUserSelect', title: 'Доступен сотруднику' },
]

async function loadItems() {
  isLoading.value = true
  try {
    await dayTypesStore.fetch()
  } catch {
    notificationStore.addNotification('Не удалось загрузить типы дней', 'error')
  } finally {
    isLoading.value = false
  }
}

// Бэк возвращает текст ошибки в { error: "..." } (см. internal/response) —
// на конфликт имени/использования типа отдельного тоста в api.js нет (тот
// перехватывает только 401/403), показываем сами.
function errorMessage(err, fallback) {
  return err?.response?.data?.error ?? fallback
}

function fieldsFor(type) {
  const fields = [
    {
      name: 'name',
      type: 'text',
      label: 'Название',
      required: true,
      value: type?.name ?? '',
    },
  ]

  // systemName используется в захардкоженных местах кода — задаётся только
  // при создании, после этого бэк его не меняет.
  if (!type) {
    fields.push({
      name: 'systemName',
      type: 'text',
      label: 'Системное имя',
      hint: 'Латиницей, без пробелов — используется в коде, изменить позже нельзя',
      required: true,
      value: '',
    })
  }

  fields.push(
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
      name: 'isWorkDay',
      type: 'checkbox',
      label: 'Рабочий день',
      value: type?.isWorkDay ?? true,
    },
    {
      name: 'affectsVacation',
      type: 'checkbox',
      label: 'Влияет на баланс отпуска',
      value: type?.affectsVacation ?? true,
    },
    {
      name: 'isUserSelect',
      type: 'checkbox',
      label: 'Доступен сотруднику при заполнении табеля',
      value: type?.isUserSelect ?? true,
    }
  )

  return fields
}

function normalize(data, existing) {
  return {
    name: data.name,
    systemName: existing?.systemName ?? data.systemName,
    colorCode: data.colorCode,
    isWorkDay: !!data.isWorkDay,
    affectsVacation: !!data.affectsVacation,
    isUserSelect: !!data.isUserSelect,
  }
}

function openCreateModal() {
  modalStore.open({
    title: 'Новый тип дня',
    submitButtonText: 'Создать',
    submittingText: 'Создание...',
    fields: fieldsFor(null),
    onSubmit: async (data) => {
      try {
        await createDayType(normalize(data))
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось создать тип дня'), 'error')
        throw err
      }
      notificationStore.addNotification('Тип дня создан', 'success')
      await loadItems()
    },
  })
}

function openEditModal(type) {
  modalStore.open({
    title: 'Тип дня',
    submitButtonText: 'Сохранить',
    submittingText: 'Сохранение...',
    showDeleteButton: true,
    deleteButtonText: 'Удалить',
    deletingText: 'Удаление...',
    fields: fieldsFor(type),
    onSubmit: async (data) => {
      try {
        await updateDayType(type.id, normalize(data, type))
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось сохранить тип дня'), 'error')
        throw err
      }
      notificationStore.addNotification('Тип дня сохранён', 'success')
      await loadItems()
    },
    onDelete: async () => {
      try {
        await deleteDayType(type.id)
      } catch (err) {
        notificationStore.addNotification(errorMessage(err, 'Не удалось удалить тип дня'), 'error')
        throw err
      }
      notificationStore.addNotification('Тип дня удалён', 'success')
      await loadItems()
    },
  })
}

onMounted(loadItems)
</script>

<style scoped>
.day-type-settings {
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
