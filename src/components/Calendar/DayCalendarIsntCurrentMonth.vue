<template>
  <div class="day" :class="{ 'day-animate': animate }" @contextmenu.prevent>
    <div
      class="sidebar-happy"
      style="
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
      "
    ></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  animate?: boolean
}

withDefaults(defineProps<Props>(), {
  animate: false,
})
</script>

<style scoped>
.day {
  display: flex;
  flex-direction: column;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  min-height: 8rem;
  min-width: 8rem;
  user-select: none;
  background: repeating-linear-gradient(
    150deg,
    transparent,
    transparent 10px,
    var(--foreground) 10px,
    var(--foreground) 20px
  );
}

.day-animate {
  background-size: 140%;
  animation: moveStripes infinite 0.5s linear;
}

@keyframes moveStripes {
  from {
    background-position: -40px 0;
  }
  to {
    background-position: 0 0; /* Смещение создает эффект движения */
  }
}

@media (max-width: 768px) {
  .day {
    min-height: 2rem;
    min-width: 2rem;
  }
}
</style>
