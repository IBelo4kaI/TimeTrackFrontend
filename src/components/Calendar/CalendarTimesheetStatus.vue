<template>
  <div v-if="calendar.selectedUserId && !calendar.isLoading && !staleState" class="timesheet-status">
    <Badge v-if="meta" :type="meta.type">{{ meta.label }}</Badge>
    <span v-else class="unavailable" role="status">Статус недоступен</span>
    <button v-if="!meta || calendar.historyError" type="button" class="retry"
      :disabled="calendar.mutationPending" @click="calendar.initialFetch()">Повторить</button>
    <span v-if="calendar.historyError" class="history-error" role="status">{{ calendar.historyError }}</span>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import Badge from '@/components/Badge.vue'
import { TIMESHEET_STATUSES } from '@/constants/timesheet.constants'

const props = defineProps({ calendar: { type: Object, required: true } })
const staleState = computed(() => {
  const state = props.calendar.monthState
  const date = props.calendar.currentDate
  return state && (state.userId !== props.calendar.selectedUserId
    || state.year !== date.getFullYear() || state.month !== date.getMonth() + 1)
})
const meta = computed(() => TIMESHEET_STATUSES[props.calendar.monthState?.status])
</script>
<style scoped>
.timesheet-status { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .5rem; max-width: 25rem; }
.unavailable { color: var(--muted-text); font-size: .85rem; }
.retry { padding: .15rem 0; border: 0; background: transparent; color: var(--accent); font: inherit; font-size: .85rem; cursor: pointer; text-decoration: underline; }
.retry:disabled { opacity: .6; cursor: wait; }
.history-error { flex-basis: 100%; color: var(--muted-text); font-size: .8rem; line-height: 1.3; }
@media (max-width: 768px) { .timesheet-status { max-width: 100%; } }
@media print { .timesheet-status { display: none !important; } }
</style>
