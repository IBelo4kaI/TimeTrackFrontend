<template>
  <div class="progress-bar">
    <div class="progress" :style="{ width: progressStyle }"></div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const { progress } = defineProps({
  progress: [String, Number],
});

const progressStyle = computed(() => {
  return `${progress}%`;
});
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 1rem;
  border-radius: var(--border-radius);
  background: var(--muted-accent);
  overflow: hidden;
}
.progress {
  height: 100%;
  background: var(--accent);
  border-radius: var(--border-radius);
  transition: width 0.4s ease;
  max-width: 100%;
}
</style>
