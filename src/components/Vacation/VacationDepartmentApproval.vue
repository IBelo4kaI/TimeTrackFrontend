<template>
  <div class="department-approval">
    <span>Согласование отдела: <Badge :type="meta.type">{{ meta.text }}</Badge></span>
    <small v-if="!compact && vacation.departmentActorId">{{ actorName }} · {{ decidedAt }}</small>
    <span v-if="!compact && vacation.departmentComment" class="department-comment">{{ vacation.departmentComment }}</span>
    <template v-if="!compact && vacation.canDepartmentApprove === true">
      <label>Комментарий руководителя (необязательно)
        <textarea v-model="comment" rows="2" maxlength="4000" :disabled="busy" />
      </label>
      <div class="department-actions">
        <ButtonUI type="success" :disabled="busy" @click="decide('approved')">Согласовать</ButtonUI>
        <ButtonUI type="destructive" :disabled="busy" @click="decide('rejected')">Отклонить</ButtonUI>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { decideVacationDepartment } from '@/services/vacation.api'

const props = defineProps({
  vacation: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['changed'])
const userStore = useUserStore()
const notifications = useNotificationStore()
const comment = ref('')
const busy = ref(false)
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
async function decide(decision) {
  if (props.compact || busy.value || props.vacation.canDepartmentApprove !== true) return
  busy.value = true
  try {
    await decideVacationDepartment(props.vacation.id, decision, comment.value.trim())
    comment.value = ''
    notifications.addNotification('Решение руководителя отдела сохранено', 'success')
    emit('changed')
  } catch (error) {
    notifications.addNotification(error.message || 'Не удалось сохранить решение', 'error')
    if (error.response?.status === 409) emit('changed')
  } finally { busy.value = false }
}
</script>

<style scoped>
.department-approval { display: flex; flex-direction: column; align-items: flex-start; gap: .5rem; font-size: .85rem; }
.department-comment { white-space: pre-wrap; overflow-wrap: anywhere; }
.department-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
label { width: 100%; }
textarea { display: block; box-sizing: border-box; width: 100%; margin-top: .35rem; padding: .5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); background: var(--background); color: var(--text); font: inherit; resize: vertical; }
small { color: var(--muted-text); }
</style>
