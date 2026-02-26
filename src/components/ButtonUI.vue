<template>
  <button :class="props.type" :disabled="props.type === 'disable'">
    <i v-if="props.icon" :class="props.icon"></i>
    <slot></slot>
  </button>
</template>

<script setup>
const props = defineProps({
  icon: String,
  type: { default: 'accent', type: String },
})
</script>

<style scoped>
button {
  /* height: 2rem; */
  display: inline-flex;
  align-items: center;
  gap: 0.57rem;
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  padding: 0.71rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  height: 3rem;
  transition: all 0.3s ease;
}
.accent {
  background: var(--accent);
  color: var(--on-accent);
}
.accent:hover {
  background: var(--muted-accent);
  color: var(--text);
}

.muted {
  background: var(--foreground);
  color: var(--text);
  border: 0.07rem solid var(--border-color);
}
.muted:hover {
  background: var(--background);
}

.muted-accent {
  color: var(--accent);
}
.muted-accent:hover {
  background: var(--muted-accent);
}

.success {
  color: var(--success);
}
.success:hover {
  background: var(--muted-success);
}

.destructive {
  color: var(--destructive);
}
.destructive:hover {
  background: var(--muted-destructive);
}

.warn {
  color: var(--warn);
}
.warn:hover {
  background: var(--muted-warn);
}

.disable {
  background: var(--muted-foreground);
  color: var(--background);
  cursor: not-allowed;
}
</style>
