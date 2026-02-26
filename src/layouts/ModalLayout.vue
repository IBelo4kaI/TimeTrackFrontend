<template>
  <div class="modal">
    <div class="modal-container">
      <div class="modal-header">
        <div class="header-info">
          <div class="modal-title" v-if="title">{{ title }}</div>
          <div class="modal-desc" v-if="desc">{{ desc }}</div>
        </div>
        <i class="fa-regular fa-xmark close" @click="close"></i>
      </div>
      <slot></slot>
    </div>
    <div class="back" @click="close"></div>
  </div>
</template>

<script setup>
const { title, desc } = defineProps({
  title: String,
  desc: String,
})
const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const closeKeyboard = (e) => {
  if (e.key == 'Escape') close()

  document.removeEventListener('keydown', closeKeyboard)
}

document.addEventListener('keydown', closeKeyboard)
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
}
.back {
  background: #9c9c9c50;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  z-index: 100;
}
.close {
  cursor: pointer;
}
.modal-container {
  display: flex;
  flex-direction: column;
  gap: 1.43rem;
  padding: 1.71rem;
  background: var(--foreground);
  border-radius: var(--border-radius);
  z-index: 101;
  max-width: 28.57rem;
  min-width: 28.57rem;
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
