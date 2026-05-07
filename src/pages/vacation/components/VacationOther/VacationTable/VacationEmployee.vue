<template>
  <div class="vacation-group__employee">
    <div class="vacation-group__employee-info">
      <div class="employee-avatar">
        {{ getInitials(employee.full_name) }}
      </div>
      <div class="employee-meta">
        <div class="employee-name">{{ employee.full_name }}</div>
        <div class="employee-position">{{ employee.position }}</div>
      </div>
    </div>

    <div v-if="showDatesCol" class="employee-dates-col">
      <span
        v-for="(v, i) in vacations"
        :key="i"
        class="vacation-date-tag"
        :class="`vacation-date-tag--${v.status}`"
      >{{ formatVacationRangeCompact(v) }}</span>
    </div>

    <slot />
  </div>
</template>

<script setup>
import { getInitials, formatVacationRangeCompact } from './vacationUtils.js'

defineProps({
  employee: {
    type: Object,
    required: true
  },
  vacations: {
    type: Array,
    default: () => []
  },
  showDatesCol: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.vacation-group__employee {
  display: flex;
  align-items: center;
  background: var(--foreground, rgba(0, 0, 0, 0.03));
  border-bottom: 0.07rem solid var(--border-color);
}
.vacation-group__employee:last-child {
  border-bottom: none;
}

.vacation-group__employee-info {
  width: 15rem;
  min-width: 15rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-right: 0.07rem solid var(--border-color);
  flex-shrink: 0;
}

.employee-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--muted-accent, rgba(99, 102, 241, 0.12));
  color: var(--accent, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.employee-name {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-position {
  font-size: 0.75rem;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.employee-meta {
  min-width: 0;
}

.employee-dates-col {
  width: 7rem;
  min-width: 7rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.4rem 0.5rem;
  border-right: 0.07rem solid var(--border-color);
  align-self: stretch;
  justify-content: center;
}

.vacation-date-tag {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  opacity: 0.9;
}

.vacation-date-tag--approved {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.vacation-date-tag--pending {
  background: color-mix(in srgb, var(--warn) 15%, transparent);
  color: color-mix(in srgb, var(--warn) 80%, var(--foreground));
}

.vacation-date-tag--rejected {
  background: color-mix(in srgb, var(--destructive) 15%, transparent);
  color: var(--destructive);
}
</style>
