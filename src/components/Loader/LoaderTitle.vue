<template>
  <div class="shimmer-loader">
    <span class="shimmer-loader__text">{{ text }}</span>
    <span v-if="label" class="shimmer-loader__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string
  label?: string
}

withDefaults(defineProps<Props>(), {
  text: 'Загрузка',
  label: '',
})
</script>

<style scoped>
.shimmer-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.shimmer-loader__text {
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: linear-gradient(
    90deg,
    var(--muted-text) 0%,
    var(--text) 40%,
    var(--muted-text) 60%,
    var(--muted-text) 100%
  );
  background-size: 250% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 1.8s linear infinite;
}

.shimmer-loader__label {
  font-size: 0.8rem;
  color: var(--muted-text);
  letter-spacing: 0.04em;
}

@keyframes shimmer {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -50% center;
  }
}
</style>
