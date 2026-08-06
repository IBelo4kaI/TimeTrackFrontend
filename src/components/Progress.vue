<template>
  <div class="progress-bar" :class="variant">
    <div
      class="progress"
      :class="variant"
      :style="{ width: progressStyle }"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const { progress } = defineProps({
  progress: [String, Number],
  variant: String,
})

const progressStyle = computed(() => {
  return `${progress}%`
})
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 0.65rem;
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

.progress-bar.primary {
  background: var(--muted-accent);
}

.progress-bar.success {
  background: var(--muted-success);
}

.progress-bar.warn {
  background: var(--muted-warn);
}

.progress-bar.destructive {
  background: var(--muted-destructive);
}

.progress.primary {
  background: var(--accent);
}

.progress.success {
  background: var(--success);
}

.progress.warn {
  background: var(--warn);
}

.progress.destructive {
  background: var(--destructive);
}
</style>
