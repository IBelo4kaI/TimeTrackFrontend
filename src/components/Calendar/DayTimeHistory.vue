<template>
  <div class="day-history">
    <p class="history-day">{{ selectedDate }}</p>
    <div class="history-events" tabindex="0" aria-label="События изменения рабочего времени">
      <article v-for="event in newestEvents" :key="event.id" class="history-event">
        <header class="event-header">
          <strong>{{ operations[event.operation] || event.operation }}</strong>
          <time :datetime="event.createdAt">{{ formatDate(event.createdAt) }}</time>
        </header>
        <div class="event-author">
          <span>{{ author(event) }}</span>
          <span class="author-role">{{ roles[event.actorType] || event.actorType }}</span>
        </div>
        <div class="event-values">
          <div class="value-block"><span class="value-title">До изменения</span><p>{{ event.operation === 'create' ? 'Нет записи' : snapshot(event.beforeValues) }}</p></div>
          <span class="value-arrow" aria-hidden="true">→</span>
          <div class="value-block"><span class="value-title">После изменения</span><p>{{ event.operation === 'delete' ? 'Запись удалена' : snapshot(event.afterValues) }}</p></div>
        </div>
        <div v-if="event.comment" class="event-comment"><span class="value-title">Комментарий</span><p>{{ event.comment }}</p></div>
      </article>
      <p v-if="!events.length" class="empty-history">Изменений за этот день нет.</p>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useDayTypesStore } from '@/stores/dayTypes'
import { historyId } from '@/utils/timeEntryHistory.utils'
const props = defineProps({ events: { type: Array, default: () => [] }, date: { type: String, required: true } })
const selectedDate = computed(() => new Date(props.date).toLocaleDateString('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }))
const newestEvents = computed(() => [...props.events].reverse())
const users = useUserStore(), types = useDayTypesStore()
const operations = { create: 'Запись создана', update: 'Запись изменена', delete: 'Запись удалена' }
const roles = { manager: 'Руководитель', employee: 'Сотрудник', admin: 'Администратор', system: 'Система' }
const author = (event) => {
  const id = historyId(event.actorId)
  if (!id) return event.actorType === 'system' ? 'Система' : 'Автор не указан'
  const user = users.usersAll.find((item) => item.id === id)
  return user ? [user.surname, user.name, user.patronymic].filter(Boolean).join(' ') : id
}
const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Дата не сохранена' : date.toLocaleString('ru-RU')
}
const snapshot = (value) => {
  if (!value) return 'Нет записи'
  try { if (typeof value === 'string') value = JSON.parse(value) } catch { return 'Значения недоступны' }
  if (!value) return 'Нет записи'
  const location = { office: 'Офис', remote: 'Удалённо' }[value.workLocation] || 'Место не задано'
  return `${types.getTypeNameById(value.dayTypeId) || value.dayTypeId} · ${value.hoursWorked} ч · ${location}`
}
</script>
<style scoped>
.day-history { display: flex; flex-direction: column; gap: .75rem; min-height: 0; min-width: 0; color: var(--text); }
.history-day { margin: 0; color: var(--muted-text); font-size: .9rem; }
.history-events { display: flex; flex-direction: column; gap: .75rem; max-height: min(32rem, calc(100dvh - 14rem)); overflow-y: auto; overscroll-behavior: contain; }
.history-event { padding: .85rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); }
.event-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .35rem .75rem; }
.event-header time { color: var(--muted-text); font-size: .8rem; }
.event-author { display: flex; flex-wrap: wrap; gap: .3rem .6rem; margin-top: .4rem; font-size: .85rem; overflow-wrap: anywhere; }
.author-role { color: var(--muted-text); }
.event-values { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: .5rem; margin-top: .75rem; }
.value-block { align-self: stretch; padding: .65rem; background: var(--background); border-radius: var(--border-radius); }
.value-title { font-size: .75rem; color: var(--muted-text); }
p { margin: .25rem 0 0; line-height: 1.45; overflow-wrap: anywhere; }
.value-block p, .event-comment p { font-size: .9rem; }
.value-arrow { color: var(--muted-text); }
.event-comment { margin-top: .7rem; padding-top: .6rem; border-top: 1px solid var(--border-color); }
.event-comment p { white-space: pre-wrap; }
.empty-history { color: var(--muted-text); }
/* Limit only the universal modal containing this history view. */
:global(.modal-container:has(.day-history)) { width: calc(100% - 1.5rem); min-width: 0; max-height: calc(100dvh - 1.5rem); padding: 1.15rem; gap: .75rem; }
:global(.modal-container:has(.day-history) .modal-fields),
:global(.modal-container:has(.day-history) .field-wrapper) { min-height: 0; }
:global(.modal-container:has(.day-history) .modal-action) { margin-top: 0; }
@media (max-width: 480px) {
  .event-values { grid-template-columns: minmax(0, 1fr); gap: .3rem; }
  .value-arrow { justify-self: center; transform: rotate(90deg); }
  .history-event { padding: .65rem; }
}
</style>
