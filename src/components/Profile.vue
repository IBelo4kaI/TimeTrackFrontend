<template>
  <div class="profile" ref="prof">
    <div class="profile-icon">{{ icon }}</div>
    <div class="profile-info">
      <div class="profile-title">{{ title }}</div>
      <div class="profile-content">{{ content }}</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, useTemplateRef } from 'vue'

const { icon, title, scale, content } = defineProps({
  icon: String,
  title: String,
  content: String,
  scale: {
    default: 1,
    type: [String, Number],
  },
})

const prof = useTemplateRef('prof')

onMounted(() => {
  prof.value.style.setProperty('--scale-profile', scale)
})
</script>

<style scoped>
.profile {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;

  --scale-profile: 1;
}
.profile-icon {
  height: 100%;
  aspect-ratio: 1 / 1;
  background: var(--accent);
  color: var(--on-accent);
  border-radius: 50%;
  padding: calc(0.5rem * var(--scale-profile));
}
.profile-info {
}
.profile-title {
  font-size: calc(0.85rem * var(--scale-profile));
  font-weight: 700;
}
.profile-content {
  font-size: calc(0.7rem * var(--scale-profile));
  font-weight: 400;
  color: var(--muted-text);
}
</style>
