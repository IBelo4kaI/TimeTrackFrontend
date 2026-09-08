<template>
  <div class="vacation-table-wrapper">
    <div class="vacation-table" ref="tableEl">
      <div class="vacation-table__inner">
        <!-- YEAR VIEW -->
        <template v-if="isYearView">
          <VacationHeader
            ref="headerRef"
            :is-year-view="isYearView"
            :months="months"
            :range-start="rangeStart"
            :range-end="rangeEnd"
          />

          <VacationGroup
            v-for="group in groupedEmployees"
            :key="group.department"
            :group="group"
          >
            <VacationEmployee
              v-for="employee in group.employees"
              :key="employee.user_id"
              :employee="employee"
              :vacations="getEmployeeVacations(employee.user_id)"
              :show-dates-col="true"
              :compact="isCompact"
            >
              <VacationYearView
                :months="months"
                :vacations="getEmployeeVacations(employee.user_id)"
                :range-start="rangeStart"
                :range-end="rangeEnd"
              />
            </VacationEmployee>
          </VacationGroup>
        </template>

        <!-- MONTH VIEW -->
        <template v-else>
          <VacationHeader
            ref="headerRef"
            :is-year-view="isYearView"
            :days="days"
            :range-start="rangeStart"
            :range-end="rangeEnd"
          />

          <VacationGroup
            v-for="group in groupedEmployees"
            :key="group.department"
            :group="group"
          >
            <VacationEmployee
              v-for="employee in group.employees"
              :key="employee.user_id"
              :employee="employee"
              :vacations="getEmployeeVacations(employee.user_id)"
              :show-dates-col="true"
              :compact="isCompact"
            >
              <VacationMonthView
                :days="days"
                :vacations="getEmployeeVacations(employee.user_id)"
              />
            </VacationEmployee>
          </VacationGroup>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useVacationOther } from '@/stores/vacationOther'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import VacationEmployee from './VacationEmployee.vue'
import VacationGroup from './VacationGroup.vue'
import VacationHeader from './VacationHeader.vue'
import VacationMonthView from './VacationMonthView.vue'
import { toDateStr } from './vacationUtils.js'
import VacationYearView from './VacationYearView.vue'

const store = useVacationOther()

const isYearView = computed(() => store.filters.viewMode === 'year')

// ─── Dates ────────────────────────────────────────────────────────────────────

const rangeStart = computed(() => {
  if (isYearView.value) return new Date(store.filters.year, 0, 1)
  return new Date(store.filters.year, store.filters.month - 1, 1)
})

const rangeEnd = computed(() => {
  if (isYearView.value) return new Date(store.filters.year, 11, 31)
  return new Date(store.filters.year, store.filters.month, 0)
})

// ─── Year view ────────────────────────────────────────────────────────────────

const months = computed(() => {
  const result = []
  for (let m = 0; m < 12; m++) {
    result.push(new Date(store.filters.year, m, 1))
  }
  return result
})

// ─── Month view ───────────────────────────────────────────────────────────────

const days = computed(() => {
  const result = []
  const count = rangeEnd.value.getDate()
  for (let d = 1; d <= count; d++) {
    const date = new Date(store.filters.year, store.filters.month - 1, d)
    result.push({
      date,
      dateStr: toDateStr(date),
      num: d,
      label: date.toLocaleString('ru', { weekday: 'short' }).slice(0, 2),
    })
  }
  return result
})

// ─── Employees & Vacations ────────────────────────────────────────────────────

const groupedEmployees = computed(() => store.filteredEmployeesGrouped)

function getEmployeeVacations(employeeId) {
  return (store.filteredVacations || []).filter((v) => {
    const vacUserId = v.userId ?? v.user_id
    if (vacUserId != employeeId) return false
    const start = parseLocalDate(v.startDate ?? v.start_date)
    const end = parseLocalDate(v.endDate ?? v.end_date)
    return start <= rangeEnd.value && end >= rangeStart.value
  })
}

// Парсим "2024-03-01" как локальную дату, а не UTC.
function parseLocalDate(str) {
  const [y, m, d] = str.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ─── Сворачивание ФИО до инициалов при скролле ─────────────────────────────────
// На мобилке колонка "Сотрудник" зафиксирована (position: sticky, left: 0) и
// всегда рисуется поверх того, что физически проскроллило под ней. Когда
// проскроллили настолько, что под sticky-колонкой больше не остаётся места
// для счётчика/"Даты" (т.е. дошли до конца столбца "Даты" — независимо от
// того, показан он сейчас или скрыт media-запросом, см. VacationEmployee.vue/
// VacationHeader.vue) и дальше начинается сама сетка календаря — прячем ФИО
// и оставляем только инициалы в аватарке (см. VacationEmployee.vue).
//
// Считаем не по подобранным вручную rem (это же самое и было корнем
// прошлого бага с шириной таблицы), а по настоящим координатам DOM: правый
// край sticky-заголовка "Сотрудник" (всегда на table.left + 15rem, т.к. он
// закреплён) и левый край сетки дней/месяцев в шапке (единственное, что
// реально отрисовано что до, что после столбца "Даты" — сам он, если
// скрыт, просто занимает 0px и не мешает сравнению).
const tableEl = ref(null)
const headerRef = ref(null)
const isCompact = ref(false)

let rafId = null

function updateCompact() {
  const titleEl = headerRef.value?.titleEl
  const gridEl = headerRef.value?.gridEl
  if (!titleEl || !gridEl) return
  const stickyRight = titleEl.getBoundingClientRect().right
  const gridLeft = gridEl.getBoundingClientRect().left
  isCompact.value = gridLeft <= stickyRight
}

function onTableScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    updateCompact()
  })
}

// Переключение год/месяц пересобирает шапку (другой ref у gridEl) — ждём
// обновления DOM и пересчитываем заново.
watch(isYearView, () => {
  nextTick(updateCompact)
})

onMounted(async () => {
  tableEl.value?.addEventListener('scroll', onTableScroll, { passive: true })
  window.addEventListener('resize', updateCompact)
  await nextTick()
  updateCompact()

  await store.initialFetch()
  // Список сотрудников подгружается асинхронно и не меняет положение
  // шапки/сетки, но на всякий случай — если это как-то сдвинуло раскладку.
  await nextTick()
  updateCompact()
})

onBeforeUnmount(() => {
  tableEl.value?.removeEventListener('scroll', onTableScroll)
  window.removeEventListener('resize', updateCompact)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────────── */
/* border-radius+overflow:hidden живут на ОБЁРТКЕ, а не на самом скролл-
   контейнере: WebKit ломает position:sticky (фон у закреплённых элементов
   пропадает при скролле), если на одном и том же элементе разом overflow
   (auto/hidden) и border-radius. */
.vacation-table-wrapper {
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  overflow: hidden;
}

/* Строки шире экрана (месяцы/дни + фикс. колонки сотрудника) — на мобилке
   скроллим по горизонтали, а не ломаем раскладку страницы. */
@media (max-width: 768px) {
  .vacation-table {
    overflow-x: auto;
    /* Без явного overflow-y браузер сам приравнивает его к overflow-x
       (нельзя "visible" по одной оси и не-visible по другой) — тогда
       .vacation-table неожиданно становится скролл-контейнером и по
       вертикали, и sticky top у шапки начинает работать не от прокрутки
       страницы, а от этого блока. */
    overflow-y: hidden;
  }

  /* КОРЕНЬ БАГА (исходная проблема): .vacation-table и каждая строка
     внутри (.vacation-table__header, .vacation-group, .vacation-group__employee)
     — обычные block-элементы без заданной ширины, поэтому их собственный
     box был равен ширине экрана (ширине .vacation-table-wrapper), а не
     реальной ширине контента. Колонки дней/месяцев внутри строки не
     сжимаются ниже min-width и просто визуально вылезали ЗА правый край
     box'а строки (overflow: visible у флекс-детей) — у этой вылезающей
     части не было фона строки, т.к. фон рисуется только в границах box'а.
     По той же причине у sticky-колонки слева (left: 0) заканчивался
     containing block ровно на ширине экрана — как только эта граница при
     скролле уходила влево за 0, sticky-элементу больше не в чем было
     стикаться, и колонка "Сотрудник" пропадала.

     ФИКС — но ВАЖНО делать его на ОТДЕЛЬНОМ элементе, не на .vacation-table:
     этот .vacation-table__inner — column-flex с width: max-content, поэтому
     его ширина считается по самой широкой строке (реальный min-content всех
     колонок), а каждая строка-флекс-айтем (align-items: stretch по
     умолчанию) растягивается ровно до этой ширины — фон и sticky-колонка
     теперь покрывают всю прокручиваемую область целиком.
     Если повесить width: max-content вместе с overflow-x: auto НА ОДИН И
     ТОТ ЖЕ элемент (как было в предыдущей версии фикса) — получится
     самообман: max-content подгоняет box строго под контент, поэтому
     ВНУТРИ этого элемента ничего больше не переполняется и скроллить
     нечего; сам же элемент при этом становится шире СВОЕГО родителя
     (.vacation-table-wrapper), у которого overflow: hidden, а не auto —
     то есть лишняя ширина просто обрезается, и скролл пропадает вообще.
     Поэтому: .vacation-table (родитель) — обычная ширина + overflow-x:auto
     (это и есть скролл-вьюпорт), а .vacation-table__inner (потомок внутри
     него) — max-content и может быть шире .vacation-table; именно это
     переполнение .vacation-table и скроллит. */
  .vacation-table__inner {
    display: flex;
    flex-direction: column;
    width: max-content;
    min-width: 100%;
  }
}
</style>
