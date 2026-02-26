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

    <slot />
  </div>
</template>

<script setup>
import { getInitials } from './vacationUtils.js'

defineProps({
  employee: {
    type: Object,
    required: true
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
</style>
