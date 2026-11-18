<template>
  <div class="day-history">
    <article v-for="event in events" :key="event.id">
      <header><strong>{{ operations[event.operation] || event.operation }}</strong><span>{{ formatDate(event.createdAt) }}</span></header>
      <p>{{ author(event) }} · {{ roles[event.actorType] || event.actorType }}</p>
      <dl><dt>До</dt><dd>{{ snapshot(event.beforeValues) }}</dd><dt>После</dt><dd>{{ snapshot(event.afterValues) }}</dd></dl>
      <p v-if="event.comment" class="comment">{{ event.comment }}</p>
    </article>
    <p v-if="!events.length">Изменений за этот день нет.</p>
  </div>
</template>
<script setup>
import { useUserStore } from '@/stores/user'
import { useDayTypesStore } from '@/stores/dayTypes'
import { historyId } from '@/utils/timeEntryHistory.utils'
defineProps({ events: { type: Array, default: () => [] } })
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
.day-history { display: flex; flex-direction: column; gap: 1rem; color: var(--text); }
article { padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: .5rem; }
header span, p { color: var(--muted-text); }
p, dd { overflow-wrap: anywhere; }
dl { display: grid; grid-template-columns: auto 1fr; gap: .5rem 1rem; }
dd { margin: 0; }
.comment { white-space: pre-wrap; color: var(--text); }
</style>
