<template>
  <div class="department-approval">
    <span v-if="compact" class="department-summary">Отдел: {{ meta.text.toLowerCase() }}</span>
    <h2 v-else-if="heading" class="department-heading">Согласование отдела <Badge :type="meta.type">{{ meta.text }}</Badge></h2>
    <Badge v-else-if="hideLabel" :type="meta.type">{{ meta.text }}</Badge>
    <span v-else>Согласование отдела: <Badge :type="meta.type">{{ meta.text }}</Badge></span>
    <small v-if="!compact && vacation.departmentActorId">{{ actorName }} · {{ decidedAt }}</small>
    <span v-if="!compact && vacation.departmentComment" class="department-comment">{{ vacation.departmentComment }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Badge from '@/components/Badge.vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  vacation: { type: Object, required: true },
  compact: { type: Boolean, default: false },
  heading: { type: Boolean, default: false },
  hideLabel: { type: Boolean, default: false },
})
const userStore = useUserStore()
const meta = computed(() => ({
  not_required: { text: 'Не требуется', type: 'muted' },
  pending: { text: 'Ожидает', type: 'warn' },
  approved: { text: 'Согласовано', type: 'success' },
  rejected: { text: 'Отклонено', type: 'destruct' },
}[props.vacation.departmentStatus] || { text: 'Не требуется', type: 'muted' }))
const actorName = computed(() => {
  const id = props.vacation.departmentActorId
  const user = userStore.usersAll.find((item) => item.id === id)
  return user ? [user.surname, user.name, user.patronymic].filter(Boolean).join(' ') : id
})
const decidedAt = computed(() => {
  const value = props.vacation.departmentDecidedAt
  const raw = value?.Valid === false ? null : value?.Time ?? value
  return raw ? new Date(raw).toLocaleString('ru-RU') : 'Время не сохранено'
})
</script>

<style scoped>
.department-approval { display: flex; flex-direction: column; align-items: flex-start; gap: .5rem; font-size: .85rem; }
.department-summary { color: var(--muted-text); }
.department-heading { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; margin: 0; font-size: 1.1rem; font-weight: 600; }
.department-comment { white-space: pre-wrap; overflow-wrap: anywhere; }
small { color: var(--muted-text); }
</style>
