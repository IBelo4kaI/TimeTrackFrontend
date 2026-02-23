<template>
  <div class="toast" :style="toastStyle">
    <div class="toast-content">
      <div class="toast-icon" :style="iconStyle">
        {{ icon }}
      </div>
      <div class="toast-message">
        {{ message }}
      </div>
      <button class="toast-close" @click="handleClose">×</button>
    </div>

    <div class="toast-progress-bg">
      <div class="toast-progress-bar" :style="progressBarStyle" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "info",
  },
  duration: {
    type: Number,
    default: 4000,
  },
  onClose: {
    type: Function,
    required: true,
  },
});

const progress = ref(100);
let timer = null;
let progressInterval = null;

const typeStyles = computed(() => {
  const styles = {
    success: {
      bg: "var(--muted-success)",
      border: "var(--success)",
      icon: "✓",
    },
    error: {
      bg: "var(--muted-destructive)",
      border: "var(--destructive)",
      icon: "✕",
    },
    warning: {
      bg: "var(--muted-warn)",
      border: "var(--warn)",
      icon: "⚠",
    },
    info: {
      bg: "var(--muted-accent)",
      border: "var(--accent)",
      icon: "ℹ",
    },
  };
  return styles[props.type] || styles.info;
});

const toastStyle = computed(() => ({
  background: typeStyles.value.bg,
  border: `2px solid ${typeStyles.value.border}`,
}));

const iconStyle = computed(() => ({
  background: typeStyles.value.border,
}));

const progressBarStyle = computed(() => ({
  background: typeStyles.value.border,
  width: `${progress.value}%`,
}));

const icon = computed(() => typeStyles.value.icon);

const handleClose = () => {
  props.onClose(props.id);
};

onMounted(() => {
  const startTime = Date.now();

  timer = setTimeout(() => {
    handleClose();
  }, props.duration);

  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 100 - (elapsed / props.duration) * 100);
    progress.value = remaining;
  }, 16);
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
  if (progressInterval) clearInterval(progressInterval);
});
</script>

<style scoped>
.toast {
  border-radius: var(--border-radius);
  padding: var(--padding-secondary);
  min-width: 300px;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  position: relative;
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  color: var(--text);
  font-size: 14px;
}

.toast-close {
  background: none;
  border: none;
  color: var(--muted-text);
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-close:hover {
  color: var(--text);
}

.toast-progress-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  transition: width 0.016s linear;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
