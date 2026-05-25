<template>
  <div class="loader-page">
    <Loader label="Загрузка данных" />
  </div>
</template>

<script setup>
import Loader from './LoaderClock.vue'
</script>

<style scoped>
.loader-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
