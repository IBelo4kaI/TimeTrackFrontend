<template>
  <div class="vacation-empty-state" role="status">
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="4" y="8" width="32" height="24" rx="3" stroke="currentColor" stroke-width="1.5" />
      <path d="M4 14h32" stroke="currentColor" stroke-width="1.5" />
      <path d="M12 20h8M12 25h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <span>Заявки не найдены</span>
  </div>
</template>

<style scoped>
.vacation-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem var(--padding-primary);
  background: var(--foreground);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--muted-text);
  font-size: 0.875rem;
  text-align: center;
}

svg {
  width: 40px;
  height: 40px;
  color: var(--border-color);
}
</style>
