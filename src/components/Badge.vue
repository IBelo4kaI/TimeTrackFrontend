<template>
  <span :class="['badge', type]" :title="title">
    <i v-if="icon != null" :class="icon"></i>
    <slot></slot>
  </span>
</template>

<script setup>
import { ref, watch } from 'vue'

const { type, title } = defineProps({
  type: { default: 'default' },
  title: String,
})

const icon = ref(null)

watch(
  () => type,
  () => {
    if (type == 'warn') {
      icon.value = 'fa-regular fa-circle-exclamation'
    } else if (type == 'success') {
      icon.value = 'fa-regular fa-circle-check'
    } else if (type == 'destruct') {
      icon.value = 'fa-regular fa-circle-xmark'
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.badge {
  padding: 0.25rem 0.35rem;
  border-radius: var(--border-radius);
}
.badge > i {
  margin-right: 0.3rem;
}
.default {
}
.muted {
  background: var(--muted-foreground);
}
.calendar-holiday {
  display: inline-block;
  color: var(--calendar-holiday);
  /* color: var(--on-accent); */
  text-wrap-mode: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  background: var(--calendar-muted-holyday);
  border: 0.07rem solid var(--calendar-holiday);
  border-radius: 1rem;
}
.warn {
  font-size: 0.9rem;
  padding: 0.2rem 0.75rem;
  background: var(--muted-warn);
  color: var(--warn);
  border: 0.07rem solid var(--warn);
  border-radius: 1rem;
  font-weight: 600;
}
.success {
  font-size: 0.9rem;
  padding: 0.2rem 0.75rem;
  background: var(--muted-success);
  color: var(--success);
  border: 0.07rem solid var(--success);
  border-radius: 1rem;
  font-weight: 600;
}
.destruct {
  font-size: 0.9rem;
  padding: 0.2rem 0.75rem;
  background: var(--muted-destructive);
  color: var(--destructive);
  border: 0.07rem solid var(--destructive);
  border-radius: 1rem;
  font-weight: 600;
}
.workers-work {
  font-size: 0.85rem;
  padding: 0.2rem 0.75rem;
  background: var(--muted-success);
  color: var(--success);
}
.workers-vacation {
  font-size: 0.85rem;
  padding: 0.2rem 0.75rem;
  background: var(--muted-warn);
  color: var(--warn);
}
.workers-medical {
  font-size: 0.85rem;
  padding: 0.2rem 0.75rem;
  background: var(--muted-destructive);
  color: var(--destructive);
}
</style>
