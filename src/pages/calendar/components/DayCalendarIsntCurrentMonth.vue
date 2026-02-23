<template>
  <div class="day" @contextmenu.prevent>
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

<script setup></script>

<style scoped>
.day {
  display: flex;
  flex-direction: column;
  /*border-top: 0.07rem solid var(--border-color);
  border-right: 0.07rem solid var(--border-color);*/
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  min-height: 7rem;
  min-width: 7rem;
  user-select: none;
  background: repeating-linear-gradient(
    150deg,
    transparent,
    transparent 10px,
    var(--foreground) 10px,
    var(--foreground) 20px
  );
}

@keyframes moveStripes {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 40px 0; /* Смещение создает эффект движения */
  }
}
</style>
