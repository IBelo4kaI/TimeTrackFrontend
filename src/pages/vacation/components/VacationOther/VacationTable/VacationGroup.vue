<template>
  <div class="vacation-group">
    <div class="vacation-group__title">{{ group.department }}</div>

    <slot />
  </div>
</template>

<script setup>
defineProps({
  group: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.vacation-group__title {
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-text);
  background: var(--foreground, rgba(0, 0, 0, 0.03));
  border-top: 0.07rem solid var(--border-color);
  border-bottom: 0.07rem solid var(--border-color);
}
</style>
