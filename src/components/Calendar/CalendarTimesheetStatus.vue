<template>
  <div class="timesheet-status">
    <span
      :class="['status-value', meta?.type, { unavailable: !meta }]"
      role="status"
    >
      {{ loading ? 'Загрузка…' : meta?.label || 'Статус недоступен' }}
    </span>
    <ButtonUI
      v-if="meta && calendar.canApprove"
      class="approval-action"
      :type="calendar.monthState.status === 'approved' ? 'muted' : 'success'"
      :disabled="
        calendar.approvalPending || calendar.mutationPending || loading
      "
      @click="calendar.setApproval(calendar.monthState.status !== 'approved')"
    >
      {{
        calendar.approvalPending
          ? 'Сохранение…'
          : calendar.monthState.status === 'approved'
            ? 'Снять подтверждение'
            : 'Подтвердить'
      }}
    </ButtonUI>
    <ButtonUI
      v-if="!loading && (!meta || calendar.historyError)"
      class="retry"
      :disabled="calendar.mutationPending || calendar.approvalPending"
      @click="calendar.initialFetch()"
    >
      Повторить
    </ButtonUI>
    <span
      v-if="!loading && calendar.historyError"
      class="history-error"
      role="status"
    >
      {{ calendar.historyError }}
    </span>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { TIMESHEET_STATUSES } from '@/constants/timesheet.constants'

const props = defineProps({ calendar: { type: Object, required: true } })
const staleState = computed(() => {
  const state = props.calendar.monthState
  const date = props.calendar.currentDate
  return (
    state &&
    (state.userId !== props.calendar.selectedUserId ||
      state.year !== date.getFullYear() ||
      state.month !== date.getMonth() + 1)
  )
})
const loading = computed(() => props.calendar.isLoading || !!staleState.value)
const meta = computed(() =>
  loading.value ? null : props.calendar.monthState?.requiresApproval === false
    ? { label: 'Подтверждение не требуется', type: 'muted' }
    : TIMESHEET_STATUSES[props.calendar.monthState?.status]
)
</script>
<style scoped>
.timesheet-status {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  font-weight: 700;
  overflow-wrap: anywhere;
  overflow: hidden;
}
.approval-action {
  justify-content: center;
  height: auto;
  /*padding: 0.4rem 0.65rem;*/
  font-size: 0.9rem;
  font-weight: 500;
  border: none;
  border-radius: 0;
}
.approval-action:disabled {
  opacity: 0.6;
  cursor: wait;
}
.status-value {
  text-align: center;
  padding: 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
}
.status-value.muted,
.unavailable {
  color: var(--muted-text);
}
.status-value.success {
  color: var(--success);
}
.status-value.warn {
  color: var(--warn);
}
.retry {
  /*color: var(--accent);*/
  font: inherit;
  font-size: 0.85rem;
  font-weight: 400;
  border: none;
  border-radius: 0;
}
.retry:disabled {
  opacity: 0.6;
  cursor: wait;
}
.history-error {
  font-weight: 400;
  color: var(--muted-text);
  font-size: 0.8rem;
  line-height: 1.3;
}
@media (max-width: 768px) {
  .retry {
    align-self: flex-start;
  }
}
@media print {
  .timesheet-status {
    display: none !important;
  }
}
</style>
