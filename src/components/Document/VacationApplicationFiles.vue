<template>
  <div class="files-placeholder">
    <i class="fa-regular fa-file-pdf"></i>
    <span>Просмотр файлов заявки будет добавлен здесь</span>
  </div>
</template>

<script setup>
defineProps({
  vacationId: { type: String, required: true },
})
</script>

<style scoped>
.files-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 4rem var(--padding-primary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  color: var(--muted-text);
}

.files-placeholder i {
  font-size: 2rem;
}
</style>
