<template>
  <Transition name="filter-overlay">
    <div
      v-if="modelValue"
      class="filter-overlay"
      @click="$emit('update:modelValue', false)"
    />
  </Transition>
  <Transition name="filter-drawer">
    <div v-if="modelValue" class="filter-drawer">
      <div class="filter-drawer__header">
        <span>{{ title }}</span>
        <button
          type="button"
          class="filter-drawer__close"
          @click="$emit('update:modelValue', false)"
          aria-label="Закрыть"
        >
          <i class="fa-light fa-xmark"></i>
        </button>
      </div>
      <div class="filter-drawer__body">
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useThemeStore } from '@/stores/themes'
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Фильтры' },
})
const emit = defineEmits(['update:modelValue'])

const { isMobile } = storeToRefs(useThemeStore())

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  }
)

// Панель — только мобильный паттерн: развернули окно до десктопа — закрываем.
watch(isMobile, (mobile) => {
  if (!mobile && props.modelValue) emit('update:modelValue', false)
})

onBeforeUnmount(() => {
  if (props.modelValue) document.body.style.overflow = ''
})
</script>

<style scoped>
.filter-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 199;
}

.filter-overlay-enter-active,
.filter-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.filter-overlay-enter-from,
.filter-overlay-leave-to {
  opacity: 0;
}

.filter-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  width: 85vw;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  background: var(--foreground);
  border-left: 0.07rem solid var(--border-color);
  z-index: 200;
}

.filter-drawer-enter-active,
.filter-drawer-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.filter-drawer-enter-from,
.filter-drawer-leave-to {
  transform: translateX(100%);
}

.filter-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--padding-secondary);
  border-bottom: 0.07rem solid var(--border-color);
  font-weight: 600;
}

.filter-drawer__close {
  background: none;
  border: none;
  color: var(--muted-text);
  font-size: 1.14rem;
  cursor: pointer;
}

.filter-drawer__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: var(--padding-secondary);
}
</style>
