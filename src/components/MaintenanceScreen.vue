<template>
  <main class="maintenance" aria-labelledby="maintenance-title">
    <section class="maintenance__card">
      <div class="maintenance__icon" aria-hidden="true">!</div>
      <p class="maintenance__label">Временные технические трудности</p>
      <h1 id="maintenance-title">Сайт временно недоступен</h1>
      <p class="maintenance__message">
        Сейчас в работе сайта возникли временные трудности. На время восстановления
        все действия приостановлены. Пожалуйста, зайдите позже.
      </p>
      <p class="maintenance__thanks">Спасибо за понимание.</p>
    </section>
  </main>
</template>

<style scoped>
.maintenance {
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  place-items: center;
  padding: 24px;
  background: var(--background);
}

.maintenance__card {
  width: 100%;
  max-width: 560px;
  padding: 40px 24px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--foreground);
  text-align: center;
}

.maintenance__icon {
  display: grid;
  width: 56px;
  height: 56px;
  margin: 0 auto 24px;
  place-items: center;
  border-radius: 50%;
  color: var(--accent);
  background: var(--muted-accent);
  font-size: 32px;
  font-weight: 700;
}

.maintenance__label {
  margin-bottom: 12px;
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
}

h1 {
  margin-bottom: 20px;
  font-size: clamp(24px, 5vw, 32px);
  line-height: 1.25;
}

.maintenance__message,
.maintenance__thanks {
  color: var(--muted-text);
  font-size: 16px;
  line-height: 1.6;
}

.maintenance__thanks {
  margin-top: 16px;
}
</style>
