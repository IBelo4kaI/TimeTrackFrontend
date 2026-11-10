<template>
  <RouterLink
    v-if="userStore.hasPermission(meta.entity, meta.action)"
    class="link"
    :class="{ 'holiday-enabled': decorations.enabled }"
    activeClass="active"
    :to="{ name: to }"
  >
    <div class="icon"><i :class="icon"></i></div>
    <div class="title">{{ title }}</div>
    <span v-if="decorations.enabled" class="snowflakes" aria-hidden="true">
      <svg width="72" height="28" viewBox="0 0 72 28" focusable="false">
        <path
          v-for="flake in snowflakes"
          :key="flake"
          :transform="flake"
          d="M0 -8V8 M-7 -4L7 4 M-7 4L7 -4 M-2 -6L0 -4L2 -6 M-2 6L0 4L2 6 M-6 -1L-3.5 -2L-4 -4.5 M6 1L3.5 2L4 4.5 M-4 4.5L-3.5 2L-6 1 M4 -4.5L3.5 -2L6 -1"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span v-if="badge > 0" class="badge">{{ badge > 99 ? '99+' : badge }}</span>
  </RouterLink>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useHolidayDecorationsStore } from '@/stores/holidayDecorations'
import { RouterLink } from 'vue-router'

const { icon, title, to, meta, badge } = defineProps({
  icon: String,
  to: String,
  title: String,
  meta: Object,
  badge: { type: Number, default: 0 },
})

const userStore = useUserStore()
const decorations = useHolidayDecorationsStore()
const snowflakes = [
  'translate(12 16) scale(.65)',
  'translate(35 9) scale(.4)',
  'translate(59 17) scale(.85)',
]
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
  font-size: 1rem;
}

.title {
  flex: 1;
}

.snowflakes { display: none; }
.active.holiday-enabled .title { flex: 0 0 auto; }
.active .snowflakes {
  display: block;
  position: relative;
  flex: 1;
  min-width: 0;
  height: 1.3rem;
  align-self: center;
  overflow: hidden;
  opacity: .55;
  pointer-events: none;
}
.snowflakes svg { position: absolute; right: 0; top: 0; height: 100%; }

.badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.29rem;
  height: 1.29rem;
  padding: 0 0.36rem;
  border-radius: 1rem;
  background: var(--destructive);
  color: #fff;
  font-size: 0.71rem;
  font-weight: 700;
}

.active .badge {
  background: var(--on-accent);
  color: var(--accent);
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

@media (max-width: 768px) {
  .link {
    /* flex-direction: column; */
    align-items: center;
    /* gap: 0.1rem; */
    padding: 0.6rem;
    /* font-size: 1.2rem; */
  }

  .icon {
    font-size: 1.2rem;
  }
}
</style>
