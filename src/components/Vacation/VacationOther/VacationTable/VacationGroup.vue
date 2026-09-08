<template>
  <div class="vacation-group">
    <div class="vacation-group__title">
      <span class="vacation-group__title-text">{{ group.department }}</span>
      <!-- Ничего не показывает — только распирает строку до полной
      прокручиваемой ширины таблицы (как это делают дни/месяцы в строках
      сотрудников), иначе и фон, и sticky-текст обрываются на границе
      видимой области, а не таблицы. -->
      <span class="vacation-group__title-filler"></span>
    </div>

    <slot />
  </div>
</template>

<script setup>
defineProps({
  group: {
    type: Object,
    required: true,
  },
})
</script>

<style scoped>
/* Фон растянут на всю строку (как было изначально), но сам текст сидит
   ровно в ширине колонки "Сотрудник" (см. .vacation-table__header-title/
   .vacation-group__employee-info) — не наезжает на "Утв./Отк." и "Даты". */
.vacation-group__title {
  display: flex;
  background: var(--foreground);
  border-top: 0.07rem solid var(--border-color);
  border-bottom: 0.07rem solid var(--border-color);
}

.vacation-group__title-text {
  width: 15rem;
  min-width: 15rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-text);
}

.vacation-group__title-filler {
  flex: 1;
}

@media (max-width: 768px) {
  .vacation-group__title-text {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--foreground);
    transform: translateZ(0);
    will-change: transform;
  }

  /* Раньше здесь стоял ручной запас (min-width: 100rem) — приблизительная
     оценка ширины остальных строк, нужная из-за того, что .vacation-table
     не считал свою реальную ширину по контенту (см. VacationTable.vue).
     Это была ровно та же болезнь, что и жалоба "фон/колонка обрывается на
     границе": число могло не совпасть с настоящей шириной (другое
     количество дней в месяце, другая ширина экрана) — и filler кончался
     раньше края таблицы. Теперь .vacation-table сам растягивается по
     самой широкой строке и стягивает эту (.vacation-group__title) строку
     до той же ширины через align-items: stretch, так что обычного
     flex: 1 у filler'а (см. базовые стили выше) достаточно — он просто
     дотягивает фон до уже правильно вычисленного края. */
}
</style>
