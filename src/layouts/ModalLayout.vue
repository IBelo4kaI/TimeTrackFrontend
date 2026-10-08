<template>
  <div class="modal">
    <div
      ref="containerRef"
      class="modal-container"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      :style="width ? { maxWidth: width } : null"
      tabindex="-1"
    >
      <div class="modal-header">
        <div class="header-info">
          <div class="modal-title" v-if="title">{{ title }}</div>
          <div class="modal-desc" v-if="desc">{{ desc }}</div>
        </div>
        <i
          class="fa-regular fa-xmark close"
          role="button"
          tabindex="0"
          aria-label="Закрыть"
          @click="close"
          @keydown.enter="close"
        ></i>
      </div>
      <slot></slot>
    </div>
    <div class="back" @click="close"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

const { title, desc, width } = defineProps({
  title: String,
  desc: String,
  width: String,
})
const emit = defineEmits(['close'])

const containerRef = useTemplateRef('containerRef')
let previousFocus = null

const close = () => {
  emit('close')
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const onKeydown = (e) => {
  if (e.key == 'Escape') {
    close()
    return
  }
  if (e.key != 'Tab' || !containerRef.value) return

  // Фокус не уходит за пределы окна
  const items = [...containerRef.value.querySelectorAll(FOCUSABLE)]
  if (!items.length) {
    e.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  if (
    e.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === containerRef.value)
  ) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  previousFocus = document.activeElement
  document.addEventListener('keydown', onKeydown)
  const target = containerRef.value?.querySelector(
    'input:not([disabled]):not([type="hidden"]), textarea:not([disabled])'
  )
  ;(target || containerRef.value)?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  previousFocus?.focus?.()
})
</script>

<style scoped>
.modal {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  animation: modalIn 0.5s;
  z-index: 100;
}
.back {
  background: #9c9c9c50;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  z-index: 99;
}
.close {
  cursor: pointer;
}
.modal-container {
  outline: none;
  display: flex;
  flex-direction: column;
  gap: 1.43rem;
  padding: 1.71rem;
  background: var(--foreground);
  border-radius: var(--border-radius);
  z-index: 101;
  width: 100%;
  max-width: 28.57rem;
  min-width: min(22rem, 100%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.43rem;
}

.modal-header > button {
  font-size: 1.43rem;
  cursor: pointer;
}

.modal-header > button:hover {
  color: var(--accent);
}

.modal-title {
  font-size: 1.29rem;
  font-weight: 700;
}

.modal-desc {
  font-size: 0.85rem;
  color: var(--muted-text);
}

@keyframes modalIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
