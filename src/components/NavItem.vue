<template>
  <component
    :is="to ? RouterLink : 'button'"
    v-if="!to || userStore.hasPermission(meta.entity, meta.action) || (meta.departmentManagerAccess && userStore.hasPermission('department.manager', 'manage'))"
    class="link"
    :class="{
      active,
      'holiday-enabled': to && decorations.enabled,
      'sending-snow': sendingSnow,
      'receiving-snow': receivingSnow,
    }"
    :data-nav-route="to"
    v-bind="to ? { activeClass: 'active', to: { name: to } } : { type: 'button' }"
    :style="colors && {
      '--nav-active-bg': colors.activeBackground,
      '--nav-active-text': colors.activeText,
      '--nav-text': colors.text,
      '--nav-hover-bg': colors.hoverBackground,
    }"
  >
    <span v-if="icon" class="icon" aria-hidden="true"><i :class="icon"></i></span>
    <span class="title">{{ title }}</span>
    <span v-if="to && decorations.enabled" class="snowflakes" aria-hidden="true">
      <svg width="72" height="28" viewBox="0 0 72 28" focusable="false">
        <g v-for="flake in snowflakes" :key="flake" :transform="flake">
          <path
            class="nav-snowflake"
            d="M0 -8V8 M-7 -4L7 4 M-7 4L7 -4 M-2 -6L0 -4L2 -6 M-2 6L0 4L2 6 M-6 -1L-3.5 -2L-4 -4.5 M6 1L3.5 2L4 4.5 M-4 4.5L-3.5 2L-6 1 M4 -4.5L3.5 -2L6 -1"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
      </svg>
    </span>
    <span v-if="badge > 0" class="badge">{{ badge > 99 ? '99+' : badge }}</span>
  </component>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useHolidayDecorationsStore } from '@/stores/holidayDecorations'
import { RouterLink } from 'vue-router'

defineProps({
  icon: String,
  to: String,
  title: String,
  meta: Object,
  active: Boolean,
  colors: Object,
  badge: { type: Number, default: 0 },
  sendingSnow: Boolean,
  receivingSnow: Boolean,
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
  color: var(--nav-text, var(--muted-text));
  transition: all 0.3s ease;
}

.link:where(button) {
  width: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.link:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.link:not(.active, .sending-snow):hover {
  background: var(--nav-hover-bg, var(--background));
  color: var(--text);
}

.icon {
  font-size: 1rem;
}

.title {
  flex: 1;
}

.snowflakes { display: none; }
:is(.active, .sending-snow).holiday-enabled .title { flex: 0 0 auto; }
:is(.active, .sending-snow) .snowflakes {
  display: block;
  position: relative;
  flex: 1;
  min-width: 0;
  height: 1.3rem;
  align-self: center;
  overflow: hidden;
  opacity: .8;
  pointer-events: none;
}
.snowflakes svg { position: absolute; right: 0; top: 0; height: 100%; }
.nav-snowflake {
  transform-box: fill-box;
  transform-origin: center;
  animation: snowflake-sway 3.2s ease-in-out infinite;
}
.snowflakes g:nth-child(2) .nav-snowflake { animation-duration: 4s; animation-delay: -1.3s; }
.snowflakes g:nth-child(3) .nav-snowflake { animation-duration: 2.8s; animation-delay: -1.8s; }

@keyframes snowflake-sway {
  0%, 100% { transform: translate(-1.5px, -3px) rotate(-25deg); opacity: .45; }
  50% { transform: translate(1.5px, 3px) rotate(25deg); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .nav-snowflake { animation: none; }
}


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

:is(.active, .sending-snow) .badge {
  background: var(--on-accent);
  color: var(--accent);
}

.active, .sending-snow {
  color: var(--nav-active-text, var(--on-accent));
  background: var(--nav-active-bg, var(--accent));
  --tw-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  box-shadow:
    var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
    var(--tw-shadow);
}

.active.receiving-snow {
  color: var(--text);
  background: var(--background);
  box-shadow: none;
}

.active.receiving-snow .snowflakes {
  visibility: hidden;
}

.active.receiving-snow .badge {
  background: var(--destructive);
  color: #fff;
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
