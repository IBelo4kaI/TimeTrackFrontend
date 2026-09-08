<template>
  <div class="vacation-group__employee">
    <div class="vacation-group__employee-info">
      <!-- Сама колонка (сверху) — фиксированной ширины всегда, наравне с
      шапкой: она в обычном потоке, и если бы сама сужалась, всё, что после
      неё в строке, сдвигалось бы влево, а шапка (её мы специально не трогаем
      — по ней меряем свёрнутость, см. VacationTable.vue) — нет, и колонки
      с днями/месяцами разъезжались бы. Сжимается только фон-обёртка внутри
      неё — на раскладку снаружи это не влияет, только "открывает" то, что
      уже физически проскроллило под sticky-колонкой. -->
      <div
        class="employee-info-bg"
        :class="{ 'employee-info-bg--compact': compact }"
      >
        <div class="employee-avatar">
          {{ getInitials(employee.full_name) }}
        </div>
        <Transition name="employee-meta">
          <div class="employee-meta" v-show="!compact">
            <div class="employee-name">{{ employee.full_name }}</div>
            <div class="employee-position">{{ employee.position }}</div>
          </div>
        </Transition>
      </div>
    </div>

    <div class="employee-count-vacation">
      <span>{{ countAll() }}</span>
      <span>|</span>
      <span>{{ countApproved() }}</span>
    </div>

    <div v-if="showDatesCol" class="employee-dates-col">
      <span
        v-for="(v, i) in vacations"
        :key="i"
        class="vacation-date-tag"
        :class="`vacation-date-tag--${v.status}`"
        v-tooltip="{ content: getVacationTooltip(v) }"
      >
        <span
          v-if="v.vacationTypeColor"
          class="vacation-date-tag__dot"
          :style="{ background: v.vacationTypeColor }"
        />
        {{ formatVacationRangeCompact(v) }}
      </span>
    </div>

    <slot />
  </div>
</template>

<script setup>
import {
  getInitials,
  formatVacationRangeCompact,
  getVacationTooltip,
} from './vacationUtils.js'

const props = defineProps({
  employee: {
    type: Object,
    required: true,
  },
  vacations: {
    type: Array,
    default: () => [],
  },
  showDatesCol: {
    type: Boolean,
    default: true,
  },
  // true, когда столбец "Сотрудник" на скролле доехал до конца столбца
  // "Даты" (см. updateCompact() в VacationTable.vue) — прячем ФИО/должность,
  // оставляем только инициалы в аватарке.
  compact: {
    type: Boolean,
    default: false,
  },
})

const countAll = () => {
  if (props.vacations && props.vacations.length > 0) {
    return props.vacations
      .filter((v) => v.status != 'rejected')
      .map((v) => v.totalDays)
      .reduce((a, v) => a + v, 0)
  } else {
    return '-'
  }
}
const countApproved = () => {
  if (props.vacations && props.vacations.length > 0) {
    return props.vacations
      .filter((v) => v.status == 'approved')
      .map((v) => v.totalDays)
      .reduce((a, v) => a + v, 0)
  } else {
    return '-'
  }
}
</script>

<style scoped>
.vacation-group__employee {
  display: flex;
  align-items: center;
  background: var(--foreground, rgba(0, 0, 0, 0.03));
  border-bottom: 0.07rem solid var(--border-color);
}
.vacation-group__employee:last-child {
  border-bottom: none;
}

/* Фиксированная ширина всегда — как у шапки (.vacation-table__header-title).
   Сама колонка в обычном потоке, и если бы она сужалась, всё, что после неё
   в строке (счётчик, диаграмма), сдвигалось бы влево, а шапка (её нарочно не
   трогаем — по ней меряем свёрнутость, см. VacationTable.vue) — нет, и
   колонки с днями/месяцами разъезжались бы. */
.vacation-group__employee-info {
  width: 15rem;
  min-width: 15rem;
  flex-shrink: 0;
}

/* Фон/паддинг/бордер — на внутренней обёртке: она может сжиматься сама по
   себе, не трогая ширину внешней колонки и раскладку строки. Бордер тоже
   здесь, а не снаружи — иначе при сжатии он остался бы висеть на границе
   полных 15rem, оторвавшись от реально видимого (уже суженного) фона. */
.employee-info-bg {
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  /* Не gap — .employee-meta сама анимирует свой отступ (margin-left) вместе
     с шириной при сворачивании, gap так не умеет (не обнуляется вместе с
     шириной нулевого элемента). */
  padding: 0.75rem;
  border-right: 0.07rem solid var(--border-color);
  overflow: hidden;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .vacation-group__employee-info {
    position: sticky;
    left: 0;
    z-index: 1;
  }

  .employee-info-bg {
    background: var(--foreground);
    transform: translateZ(0);
    will-change: transform;
    transition: width 0.2s ease;
  }

  /* Ширина сжатого состояния — ровно под аватарку с паддингами
     (0.75rem + 2rem + 0.75rem), остальное становится прозрачным и
     открывает диаграмму, уже проскроллившую под sticky-колонкой. */
  .employee-info-bg--compact {
    width: 3.5rem;
  }

  .employee-dates-col {
    display: none;
  }
}

.employee-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--muted-accent, rgba(99, 102, 241, 0.12));
  color: var(--accent, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.employee-name {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-position {
  font-size: 0.75rem;
  color: var(--muted-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.employee-meta {
  min-width: 0;
  max-width: 9rem;
  margin-left: 0.75rem;
  overflow: hidden;
  white-space: nowrap;
}

.employee-meta-enter-active,
.employee-meta-leave-active {
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease,
    margin-left 0.2s ease;
}

.employee-meta-enter-from,
.employee-meta-leave-to {
  opacity: 0;
  max-width: 0;
  margin-left: 0;
}

.employee-count-vacation {
  width: 7rem;
  min-width: 7rem;
  padding: 0.4rem 0.5rem;
  flex-shrink: 0;
  display: flex;
  align-self: stretch;
  border-right: 0.07rem solid var(--border-color);
  justify-content: space-evenly;
  align-items: center;
}

.employee-count-vacation > span:nth-child(1) {
  color: color-mix(in srgb, var(--warn) 80%, var(--foreground));
}

.employee-count-vacation > span:nth-child(2) {
  color: var(--border-color);
  font-weight: 600;
}

.employee-count-vacation > span:nth-child(3) {
  color: var(--success);
}

.employee-dates-col {
  width: 8rem;
  min-width: 8rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.4rem 0.5rem;
  border-right: 0.07rem solid var(--border-color);
  align-self: stretch;
  justify-content: center;
}

.vacation-date-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  opacity: 0.9;
}

.vacation-date-tag__dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.vacation-date-tag--approved {
  background: color-mix(in srgb, var(--success) 15%, transparent);
  color: var(--success);
}

.vacation-date-tag--pending {
  background: color-mix(in srgb, var(--warn) 15%, transparent);
  color: color-mix(in srgb, var(--warn) 80%, var(--foreground));
}

.vacation-date-tag--rejected {
  background: color-mix(in srgb, var(--destructive) 15%, transparent);
  color: var(--destructive);
}
</style>
