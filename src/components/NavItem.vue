<template>
  <RouterLink
    v-if="userStore.hasPermission(meta.entity, meta.action)"
    class="link"
    activeClass="active"
    :to="{ name: to }"
  >
    <div class="icon"><i :class="icon"></i></div>
    <div class="title">{{ title }}</div>
  </RouterLink>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

const { icon, title, to, meta } = defineProps({
  icon: String,
  to: String,
  title: String,
  meta: Object,
})

const userStore = useUserStore()

onMounted(() => {
  console.log(meta)
})
</script>

<style scoped>
.link {
  display: flex;
  gap: 0.5rem;
  padding: 0.71rem;
  border-radius: var(--border-radius);
  color: var(--muted-text);
  transition: all 0.3s ease;
}
.link:not(.active):hover {
  background: var(--background);
  color: var(--text);
}
.icon {
}
.title {
}
.active {
  color: var(--on-accent);
  background: var(--accent);
  --tw-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  box-shadow:
    var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
    var(--tw-shadow);
}
</style>
