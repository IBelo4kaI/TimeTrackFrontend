<template>
  <div class="calendar-events-list">
    <AppTable
      :headers="headers"
      :rows="items ?? []"
      :loading="loading"
      row-key="id"
    >
      <template #toolbar>
        <div class="calendar-events-list__year">
          <ButtonUI type="muted" @click="selectedYear -= 1">Прошлый</ButtonUI>
          {{ selectedYear }} год
          <ButtonUI type="muted" @click="selectedYear += 1">Следующий</ButtonUI>
        </div>

        <div class="spacer"></div>

        <div class="action-add">
          <ButtonUI @click="openAddModal">Добавить</ButtonUI>
        </div>
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import AppTable from '@/components/AppTable.vue'
import { ref, watch } from 'vue'
import {
  getCalendarEventForYear,
  createCalendarEvent,
} from '@/services/calendarEvents.api'
import { getDateNamed } from '@/utils/calendar.utils'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'

const selectedYear = ref(new Date().getFullYear())
const items = ref(null)
const loading = ref(false)

const dayTypeStore = useDayTypesStore()
const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

const headers = [
  { valueKey: 'description', title: 'Описание' },
  {
    valueKey: 'eventDate',
    title: 'Дата',
    format: (v) => getDateNamed(new Date(v)),
  },
  {
    valueKey: 'dayTypeId',
    title: 'Тип дня',
    format: (v) => dayTypeStore.getTypeNameById(v),
  },
]

async function loadEvents() {
  loading.value = true
  try {
    items.value = await getCalendarEventForYear(selectedYear.value)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  modalStore.open({
    title: 'Добавить календарный ивент',
    submitButtonText: 'Добавить',
    submittingText: 'Сохранение...',
    fields: [
      {
        name: 'eventDate',
        type: 'date',
        label: 'Дата',
        required: true,
      },
      {
        name: 'dayTypeId',
        type: 'select',
        label: 'Тип дня',
        required: true,
        options: [
          ...dayTypeStore.dayTypes.values().filter((v) => !v.isUserSelect),
        ].map((t) => ({
          value: t.id,
          label: t.name,
        })),
      },
      {
        name: 'description',
        type: 'text',
        label: 'Описание',
      },
    ],
    onSubmit: async (data) => {
      await createCalendarEvent(data)
      notificationStore.addNotification('Ивент добавлен!', 'success')
      await loadEvents()
    },
  })
}

watch(selectedYear, loadEvents, { immediate: true })
</script>

<style scoped>
.calendar-events-list {
  display: flex;
  flex-direction: column;
  gap: var(--gap-primary);
}

.calendar-events-list__year {
  display: flex;
  align-items: center;
  gap: var(--gap-secondary);
}
</style>
