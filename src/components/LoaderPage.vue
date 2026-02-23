<template>
  <div class="loader-page">
    <Loader :is-loading="true" />
  </div>
</template>

<script setup>
import Loader from './Loader.vue'
</script>

<style scoped>
.loader-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
</style>
