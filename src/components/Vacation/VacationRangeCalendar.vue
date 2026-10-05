<template>
  <div class="range-calendar">
    <div class="range-calendar__nav">
      <button
        type="button"
        class="range-calendar__arrow"
        aria-label="Предыдущий месяц"
        @click="shiftView(-1)"
      >
        ‹
      </button>
      <MonthYearSelect
        v-model:month="viewMonth"
        v-model:year="viewYear"
        :allow-all-months="false"
        align="center"
      />
      <button
        type="button"
        class="range-calendar__arrow"
        aria-label="Следующий месяц"
        @click="shiftView(1)"
      >
        ›
      </button>
    </div>

    <div class="range-calendar__summary">
      <template v-if="startDate">
        <span class="range-calendar__period">
          {{ formatDate(startDate) }}
          <template v-if="endDate"> — {{ formatDate(endDate) }}</template>
        </span>
        <span v-if="days != null" class="range-calendar__days">
          {{ formatStats(days) }}
        </span>
      </template>
      <span v-else class="range-calendar__hint">
        Выберите даты в календаре или в форме
      </span>
    </div>

    <div class="range-calendar__months">
      <section v-for="m in months" :key="m.key" class="month">
        <div class="month__title">{{ m.title }}</div>

        <div class="month__grid">
          <span v-for="name in DAY_NAMES_SHORT" :key="name" class="month__dow">
            {{ name }}
          </span>

          <span v-for="n in m.offset" :key="`blank-${n}`" />

          <button
            v-for="d in m.days"
            :key="d.dateStr"
            type="button"
            class="day"
            :class="{
              'day--weekend': d.isWeekend && !d.isHoliday,
              'day--holiday': d.isHoliday,
              'day--in-range': d.inRange,
              'day--start': d.isStart,
              'day--end': d.isEnd,
            }"
            :title="d.title"
            @click="onDayClick(d.dateStr)"
          >
            {{ d.num }}
          </button>
        </div>
      </section>
    </div>

    <div class="range-calendar__legend">
      <span><i class="dot dot--range"></i> Отпуск</span>
      <span><i class="dot dot--weekend"></i> Выходной</span>
      <span><i class="dot dot--holiday"></i> Праздник</span>
      <span class="range-calendar__tip">
        Клик — начало, второй клик — окончание
      </span>
    </div>
  </div>
</template>

<script setup>
import MonthYearSelect from '@/components/MonthYearSelect.vue'
import { DAY_NAMES_SHORT, MONTH_NAMES } from '@/constants/calendar.constants'
import { getCalendarDays } from '@/services/calendar.api'
import { useDayTypesStore } from '@/stores/dayTypes'
import { formatStats } from '@/utils/vacation.utils'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  startDate: { type: String, default: '' }, // 'YYYY-MM-DD'
  endDate: { type: String, default: '' },
  userId: { type: String, default: '' },
  days: { type: Number, default: null },
})

const MIN_MONTHS = 2
const MAX_MONTHS = 6

const emit = defineEmits(['select'])

// Первый клик — начало, второй — окончание (если не раньше начала); клик
// при уже выбранном периоде или раньше начала — новое начало
function onDayClick(dateStr) {
  const hasOnlyStart = props.startDate && !props.endDate
  if (hasOnlyStart && dateStr >= props.startDate) {
    emit('select', { startDate: props.startDate, endDate: dateStr })
  } else {
    emit('select', { startDate: dateStr, endDate: '' })
  }
}

const dayTypesStore = useDayTypesStore()

const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const formatDate = (str) => str.split('-').reverse().join('.')

// Первый показываемый месяц (меняется стрелками и выбором месяца); сначала —
// месяц начала отпуска, без дат — текущий
const initial = props.startDate
  ? props.startDate.split('-').map(Number)
  : [new Date().getFullYear(), new Date().getMonth() + 1]
const viewYear = ref(initial[0])
const viewMonth = ref(initial[1])

function shiftView(delta) {
  const index = viewYear.value * 12 + (viewMonth.value - 1) + delta
  viewYear.value = Math.floor(index / 12)
  viewMonth.value = (index % 12) + 1
}

// Показываем минимум MIN_MONTHS месяцев, больше — чтобы уместился выбранный
// период (не больше MAX_MONTHS)
const monthKeys = computed(() => {
  let count = MIN_MONTHS
  if (props.endDate) {
    const [endY, endM] = props.endDate.split('-').map(Number)
    const span = (endY - viewYear.value) * 12 + (endM - viewMonth.value) + 1
    count = Math.min(MAX_MONTHS, Math.max(MIN_MONTHS, span))
  }

  return Array.from({ length: count }, (_, i) => {
    const index = viewMonth.value - 1 + i
    return {
      year: viewYear.value + Math.floor(index / 12),
      month: (index % 12) + 1,
    }
  })
})

// Начало выбрали вне показанных месяцев (в форме) — переходим к нему
watch(
  () => props.startDate,
  (start) => {
    if (!start) return
    const [y, m] = start.split('-').map(Number)
    if (!monthKeys.value.some((k) => k.year === y && k.month === m)) {
      viewYear.value = y
      viewMonth.value = m
    }
  }
)

// Дни месяцев с бэка: выходные и праздничные события (кэш по месяцу и сотруднику)
const loaded = ref({}) // 'userId:year-month' -> days[]
let loadSeq = 0

watch(
  [monthKeys, () => props.userId],
  async ([keys, userId]) => {
    if (!userId) return
    const seq = ++loadSeq
    await Promise.all(
      keys.map(async ({ year, month }) => {
        const key = `${userId}:${year}-${month}`
        if (loaded.value[key]) return
        try {
          const result = await getCalendarDays(month, year, userId)
          if (seq === loadSeq || !loaded.value[key]) {
            loaded.value[key] = result?.days ?? []
          }
        } catch {
          // без данных календаря просто не подсвечиваем выходные и праздники
        }
      })
    )
  },
  { immediate: true }
)

const holidayTypeId = computed(() =>
  dayTypesStore.getDayTypeIdByName('holiday-not-work')
)

const months = computed(() =>
  monthKeys.value.map(({ year, month }) => {
    const count = new Date(year, month, 0).getDate()
    // Понедельник — первый столбец
    const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7
    const fromServer = loaded.value[`${props.userId}:${year}-${month}`] ?? []
    const byDate = new Map(fromServer.map((d) => [String(d.date).slice(0, 10), d]))

    const days = Array.from({ length: count }, (_, i) => {
      const num = i + 1
      const dateStr = toDateStr(year, month, num)
      const srv = byDate.get(dateStr)
      const dow = (offset + i) % 7
      const isHoliday =
        !!srv?.calendarEventTypeId && srv.calendarEventTypeId === holidayTypeId.value

      return {
        num,
        dateStr,
        // Без ответа бэка — обычные суббота и воскресенье
        isWeekend: srv ? !!srv.isWeekend : dow >= 5,
        isHoliday,
        title: srv?.holidays?.[0] ?? '',
        inRange:
          !!props.startDate &&
          dateStr >= props.startDate &&
          dateStr <= (props.endDate || props.startDate),
        isStart: dateStr === props.startDate,
        // Пока окончание не выбрано — подсвечиваем один день начала
        isEnd: !!props.startDate && dateStr === (props.endDate || props.startDate),
      }
    })

    return {
      key: `${year}-${month}`,
      title: `${MONTH_NAMES[month - 1]} ${year}`,
      offset,
      days,
    }
  })
)
</script>

<style scoped>
.range-calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  min-width: 0;
}

.range-calendar__nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.range-calendar__arrow {
  width: 2.5rem;
  height: 3rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--foreground);
  color: var(--muted-text);
  font-size: 1.1rem;
  cursor: pointer;
}

.range-calendar__arrow:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.range-calendar__summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-weight: 600;
}

.range-calendar__days {
  padding: 0.15rem 0.6rem;
  border-radius: var(--border-radius);
  background: var(--muted-accent);
  color: var(--accent);
  font-size: 0.9rem;
}

.range-calendar__hint {
  color: var(--muted-text);
  font-weight: 400;
}

.range-calendar__months {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1.25rem;
}

.month__title {
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: capitalize;
}

.month__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.15rem;
  text-align: center;
}

.month__dow {
  padding-bottom: 0.25rem;
  color: var(--muted-text);
  font-size: 0.75rem;
}

.day {
  padding: 0.4rem 0;
  border: none;
  border-radius: 0.4rem;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.day:hover:not(.day--in-range) {
  background: var(--muted-foreground);
}

.day--weekend {
  color: var(--muted-text);
}

.day--holiday {
  color: var(--destructive);
  font-weight: 600;
}

.day--in-range {
  background: var(--muted-accent);
  color: var(--accent);
  border-radius: 0;
}

.day--start {
  border-radius: 0.4rem 0 0 0.4rem;
}

.day--end {
  border-radius: 0 0.4rem 0.4rem 0;
}

.day--start.day--end {
  border-radius: 0.4rem;
}

.day--start,
.day--end {
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 700;
}

.range-calendar__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--muted-text);
  font-size: 0.85rem;
}

.range-calendar__tip {
  margin-left: auto;
}

.dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  margin-right: 0.3rem;
  border-radius: 50%;
}

.dot--range {
  background: var(--accent);
}

.dot--weekend {
  background: var(--muted-text);
}

.dot--holiday {
  background: var(--destructive);
}
</style>
