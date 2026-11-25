<template>
  <div class="sidebar">
    <SidebarTitle @close="closeSidebar" />
    <div class="sidebar-nav-viewport">
      <Transition name="main-nav">
        <nav
          v-show="!submenuVisible"
          ref="navigation"
          class="sidebar-nav"
          aria-label="Основное меню"
          :inert="submenuVisible"
        >
          <NavItem
            v-for="item in routesNavigation"
            :key="item.name"
            :icon="item.meta.icon"
            :title="item.meta.title"
            :to="item.name"
            :meta="item.meta"
            :badge="item.name === 'chats' ? chatStore.totalUnread : 0"
            :sending-snow="snowTransfer?.from === item.name"
            :receiving-snow="snowTransfer?.to === item.name"
            @click.capture="onNavClick($event, item.name)"
          />
          <NavItem
            v-if="hasSubmenu && !hasCurrentNavItem"
            :title="route.meta.title"
            data-submenu-trigger
            @click="openSubmenu"
          />
          <div
            v-if="decorations.enabled"
            ref="snowLayer"
            class="sidebar-snow"
            aria-hidden="true"
          >
            <i v-for="index in 16" :key="index" class="fa-regular fa-snowflake"></i>
          </div>
        </nav>
      </Transition>
      <Transition name="section-nav" @before-leave="(pane) => (pane.inert = true)">
        <nav v-if="submenuVisible" class="sidebar-nav" :aria-label="route.meta.title">
          <NavItem
            title="Назад"
            icon="fa-regular fa-arrow-left"
            data-submenu-back
            @click="showMainNavigation"
          />
          <h2 class="sidebar-section-title">{{ route.meta.title }}</h2>
          <NavItem
            v-for="item in submenuStore.items"
            :key="item.id"
            :title="item.label"
            :icon="item.icon"
            :colors="item.colors"
            :active="submenuStore.activeTab === item.id"
            :aria-pressed="submenuStore.activeTab === item.id"
            @click="selectTab(item.id)"
          />
        </nav>
      </Transition>
    </div>

    <div v-if="decorations.enabled" class="sidebar-countdown">
      <NewYearCountdown />
    </div>

    <!-- Переключатель темы — на десктопе живёт в шапке, сюда переезжает
    только на мобилке (см. media query ниже), без JS-детекта ширины. -->
    <div class="sidebar-theme">
      <ToggleHolidayDecorations />
      <ToggleTheme />
    </div>
  </div>
</template>

<script setup>
import { routesNavigation } from '@/router'
import { useChatStore } from '@/stores/chat'
import { useHolidayDecorationsStore } from '@/stores/holidayDecorations'
import { useSubmenuStore } from '@/stores/submenu'
import gsap from 'gsap'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavItem from '../NavItem.vue'
import ToggleHolidayDecorations from '../ToggleHolidayDecorations.vue'
import ToggleTheme from '../ToggleTheme.vue'
import NewYearCountdown from './NewYearCountdown.vue'
import SidebarTitle from './SidebarTitle.vue'

const chatStore = useChatStore()
const decorations = useHolidayDecorationsStore()
const submenuStore = useSubmenuStore()
const route = useRoute()
const props = defineProps({ isSidebarOpen: Boolean })
const emits = defineEmits(['update:isSidebarOpen'])
const navigation = ref(null)
const snowLayer = ref(null)
const snowTransfer = ref(null)
const dismissedPath = ref(null)
const hasSubmenu = computed(() => submenuStore.items.length > 1)
const submenuVisible = computed(
  () => hasSubmenu.value && dismissedPath.value !== route.path
)
const hasCurrentNavItem = computed(() =>
  Object.values(routesNavigation).some((item) => item.name === route.name)
)
let snowFlight = null

function closeSidebar() {
  emits('update:isSidebarOpen', false)
}

function canAnimateSnow() {
  return (
    decorations.enabled &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

async function showMainNavigation() {
  dismissedPath.value = route.path
  await nextTick()
  navigation.value
    ?.querySelector('[aria-current="page"], [data-submenu-trigger], .active')
    ?.focus()
}

async function openSubmenu(event) {
  dismissedPath.value = null
  const viewport = event.currentTarget.closest('.sidebar-nav-viewport')
  await nextTick()
  viewport?.querySelector('[data-submenu-back]')?.focus()
}

function selectTab(id) {
  submenuStore.setActiveTab(id)
  closeSidebar()
}

function onNavClick(event, name) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  if (name === route.name && hasSubmenu.value) {
    event.preventDefault()
    openSubmenu(event)
    return
  }

  if (!canAnimateSnow() || name === route.name) closeSidebar()
}

function stopSnowFlight() {
  if (snowFlight) {
    snowFlight.revert()
    snowFlight = null
  }
  snowTransfer.value = null
}

function animateSnow(from, to) {
  const layer = snowLayer.value
  const sourceFlakes = from?.querySelectorAll('.nav-snowflake')
  if (!layer || !sourceFlakes?.length || !to || from === to) return false

  const area = layer.getBoundingClientRect()
  const destination = to.getBoundingClientRect()
  const origins = Array.from(sourceFlakes, (flake) =>
    flake.getBoundingClientRect()
  )
  if (!origins.some(({ width }) => width > 0)) return false

  snowTransfer.value = { from: from.dataset.navRoute, to: to.dataset.navRoute }
  snowFlight = gsap.timeline({ onComplete: closeSidebar })
  const flakes = Array.from(layer.children)

  flakes.forEach((flake, index) => {
    const origin = origins[index % origins.length]
    const startX = origin.left + origin.width / 2 - area.left
    const startY = origin.top + origin.height / 2 - area.top
    const endX =
      destination.left -
      area.left +
      destination.width * gsap.utils.random(0.12, 0.91)
    const endY =
      destination.top -
      area.top +
      destination.height * gsap.utils.random(0.2, 0.8)
    const delay = index * 0.014

    snowFlight
      .set(
        flake,
        {
          x: startX,
          y: startY,
          scale: gsap.utils.random(0.55, 1),
          opacity: 0.9,
        },
        delay
      )
      .to(
        flake,
        {
          x: endX,
          y: endY,
          rotation: gsap.utils.random(-100, 100),
          duration: 0.51,
          ease: 'none',
        },
        delay
      )
  })

  const landing = snowFlight.duration()
  snowFlight
    .call(
      () => {
        snowTransfer.value = null
      },
      [],
      landing
    )
    .to(flakes, { opacity: 0, duration: 0.22 }, landing)
  return true
}

watch(
  () => route.path,
  () => {
    dismissedPath.value = null
    const links = Array.from(
      navigation.value?.querySelectorAll('[data-nav-route]') ?? []
    )
    const from = links.find((link) => link.classList.contains('active'))
    const to = links.find((link) => link.dataset.navRoute === route.name)

    stopSnowFlight()
    const sidebarVisible =
      props.isSidebarOpen || !window.matchMedia('(max-width: 768px)').matches
    if (sidebarVisible && canAnimateSnow() && animateSnow(from, to)) return
    closeSidebar()
  }
)

watch(
  () => decorations.enabled,
  (enabled) => {
    if (!enabled && snowFlight) {
      stopSnowFlight()
      closeSidebar()
    }
  }
)

watch(
  () => props.isSidebarOpen,
  (open) => {
    if (open) dismissedPath.value = null
    else stopSnowFlight()
  }
)

onBeforeUnmount(stopSnowFlight)
</script>

<style scoped>
.sidebar {
  grid-area: sidebar;
  position: fixed;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  background: var(--foreground);
  border-right: 0.07rem solid var(--border-color);
  z-index: 100;
  overflow-y: auto;
}

.sidebar > * {
  flex-shrink: 0;
}
.sidebar-countdown {
  margin: auto 0.71rem 0.71rem;
  padding-top: 0.71rem;
}

.sidebar-nav-viewport {
  position: relative;
  flex: 1 1 auto;
  min-height: 7rem;
  overflow: clip;
}

.sidebar-nav {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  padding: var(--padding-primary) 0.71rem;
  overflow-y: auto;
}

.sidebar-nav > :deep(.link) {
  flex-shrink: 0;
}

.sidebar-section-title {
  margin: 0.36rem 0.71rem 0;
  color: var(--muted-text);
  font-size: 0.875rem;
  font-weight: 600;
}

.main-nav-enter-active,
.main-nav-leave-active,
.section-nav-enter-active,
.section-nav-leave-active {
  transition: transform 240ms ease, opacity 240ms ease;
}

.main-nav-leave-active,
.section-nav-leave-active {
  pointer-events: none;
}

.main-nav-enter-from,
.main-nav-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.section-nav-enter-from,
.section-nav-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar .sidebar-nav,
  .sidebar.sidebar {
    transition: none;
  }
}

.sidebar-snow {
  position: absolute;
  inset: 0;
  z-index: 1;
  color: var(--accent);
  pointer-events: none;
}

.sidebar-snow i {
  position: absolute;
  top: -0.5em;
  left: -0.5em;
  width: 1em;
  font-size: 0.75rem;
  text-align: center;
  opacity: 0;
}

.sidebar-theme {
  display: none;
  margin-top: auto;
  padding: 0.71rem;
  border-top: 0.07rem solid var(--border-color);
  align-items: center;
  gap: 0.36rem;
}

.sidebar-countdown + .sidebar-theme {
  margin-top: 0;
}

@media (max-width: 768px) {
  .sidebar-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    /* перекрываем overlay */
    z-index: 100;
  }

  .container.sidebar-open .sidebar {
    transform: translateX(0);
  }

  .sidebar-theme {
    display: flex;
    justify-content: center;
  }
}

@media print {
  .sidebar {
    display: none !important;
  }
}
</style>
