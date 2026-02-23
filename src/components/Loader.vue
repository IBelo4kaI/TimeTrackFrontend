<template>
  <div class="loading" v-if="props.isLoading">
    Загрузка данных
    <i class="fa-regular fa-loader fa-spin"></i>
  </div>
</template>

<script setup>
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: true,
  },
})
</script>

<style scoped>
.loading {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
}
</style>
