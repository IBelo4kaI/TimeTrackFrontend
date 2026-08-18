import { getInternalEmployees } from '@/services/reference.api'
import { getSickLeavesByYear } from '@/services/sick_leave.api'
import { getStatistics } from '@/services/userTimeEntries.api'
import { getVacationsByYear, getVacationStats } from '@/services/vacation.api'
import { flattenInternalEmployees, parseGenderId } from '@/utils/user.utils'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useUserStore } from './user'

const createEmptyVacationStats = () => ({ used: 0, pending: 0, free: 0 })
// Нет эндпоинта "список лет, за которые есть данные" (и нет даты приёма на
// работу, от которой можно было бы её вычислить) — просто показываем
// фиксированное окно последних N лет, включая текущий.
const VACATION_STATS_YEARS_COUNT = 5
const createEmptyMonthStats = () => ({
  hours: { totalHours: 0, standardHours: 0 },
  workDays: { totalWorkDays: 0, standardWorkDays: 0 },
})
// Пустая строка месяца для таблицы табеля — до ответа с бэка/если запрос
// за месяц упал (Promise.allSettled), чтобы месяц всё равно попал в таблицу.
const createEmptyMonthRow = (month) => ({
  month,
  standardHours: 0,
  totalHours: 0,
  standardWorkDays: 0,
  totalWorkDays: 0,
  medicalDays: 0,
  timeoffDays: 0,
  vacationDays: 0,
  decreeDays: 0,
})

// Данные карточки сотрудника (/workers/:id) — открывается по клику на
// строку в общей таблице табеля (только у тех, у кого calendar.all:read).
// Один активный сотрудник за раз, как в stores/report.js: не нужно держать
// в памяти данные сразу по всем.
export const useWorkerStore = defineStore('worker', () => {
  const userStore = useUserStore()

  const employeeId = ref(null)
  const year = shallowRef(new Date().getFullYear())
  const isLoading = shallowRef(false)
  const isLoaded = shallowRef(false)

  const monthStats = ref(createEmptyMonthStats())
  const vacationStats = ref(createEmptyVacationStats())
  const vacations = ref([])
  const sickLeaves = ref([])

  // --- Табель (вкладка "Табель") ---
  // Отдельно от monthStats выше: тот всегда "текущий месяц" для карточки на
  // Главной, а тут — таблица по всем 12 месяцам выбранного года, грузится
  // лениво при открытии вкладки, а не вместе с load().
  const timesheetYear = shallowRef(new Date().getFullYear())
  const timesheetMonths = ref([])
  const isLoadingTimesheet = shallowRef(false)
  // --- Отпуска (вкладка "Отпуска") ---
  // Баланс отпуска по годам — свой запрос на каждый год (getVacationStats
  // считает только один год за раз), грузится лениво при открытии вкладки.
  const vacationYearlyStats = ref([])
  const isLoadingVacationStats = shallowRef(false)

  // Доп. данные из справочника (должность/отдел/компания) — сопоставляются
  // по user_id, то же самое, что stores/report.js делает по ФИО.
  const directoryEntry = ref(null)

  // Базовый профиль (ФИО, день рождения, пол…) — берём из уже загруженного
  // общего списка пользователей (userStore.usersAll), отдельным запросом за
  // одним пользователем сервис прав не располагает.
  const profile = computed(
    () => userStore.usersAll.find((u) => u.id === employeeId.value) ?? null
  )

  const fullName = computed(() => {
    if (!profile.value) return ''
    return [profile.value.surname, profile.value.name, profile.value.patronymic]
      .filter(Boolean)
      .join(' ')
  })

  const initials = computed(() => {
    if (!profile.value) return '?'
    return [profile.value.surname?.[0], profile.value.name?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase()
  })

  // На отпуске/больничном/на работе прямо сегодня — по уже загруженным
  // спискам за текущий год, отдельного запроса не требует.
  const todayStatus = computed(() => {
    const now = new Date()
    const isNowBetween = (start, end) => {
      const s = new Date(start)
      const e = new Date(end)
      e.setHours(23, 59, 59, 999)
      return now >= s && now <= e
    }

    const activeVacation = vacations.value.find(
      (v) => v.status === 'approved' && isNowBetween(v.startDate, v.endDate)
    )
    if (activeVacation) {
      return { type: 'vacation', label: 'В отпуске', badge: 'workers-vacation' }
    }

    const activeSickLeave = sickLeaves.value.find((s) =>
      isNowBetween(s.startDate, s.endDate)
    )
    if (activeSickLeave) {
      return { type: 'sick', label: 'На больничном', badge: 'workers-medical' }
    }

    return { type: 'work', label: 'На работе', badge: 'workers-work' }
  })

  const nextVacation = computed(() => {
    const now = new Date()
    return (
      vacations.value
        .filter((v) => v.status === 'approved' && new Date(v.startDate) >= now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] ?? null
    )
  })

  const sickDaysThisYear = computed(() =>
    sickLeaves.value.reduce((sum, s) => {
      const days =
        Math.round(
          (new Date(s.endDate) - new Date(s.startDate)) / (1000 * 60 * 60 * 24)
        ) + 1
      return sum + Math.max(days, 0)
    }, 0)
  )

  // Последние заявки (отпуска + больничные) вперемешку, свежие сверху — для
  // блока "Последние заявки" на главной вкладке.
  const recentRequests = computed(() => {
    const vacationItems = vacations.value.map((v) => ({
      kind: 'vacation',
      id: v.id,
      startDate: v.startDate,
      endDate: v.endDate,
      status: v.status,
      totalDays: v.totalDays,
      typeName: v.vacationTypeName,
    }))
    const sickItems = sickLeaves.value.map((s) => ({
      kind: 'sick',
      id: s.id,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
    }))

    return [...vacationItems, ...sickItems]
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .slice(0, 5)
  })

  // Нет пола — бэк не может посчитать норму часов/дней (см. parseGenderId и
  // тот же костыль в stores/report.js и stores/calendar.js).
  const timesheetUnavailable = computed(() => !parseGenderId(profile.value))

  // Итог за год — сумма по всем месяцам, строкой снизу таблицы табеля.
  const timesheetTotals = computed(() =>
    timesheetMonths.value.reduce(
      (acc, m) => ({
        standardHours: acc.standardHours + m.standardHours,
        totalHours: acc.totalHours + m.totalHours,
        standardWorkDays: acc.standardWorkDays + m.standardWorkDays,
        totalWorkDays: acc.totalWorkDays + m.totalWorkDays,
        medicalDays: acc.medicalDays + m.medicalDays,
        timeoffDays: acc.timeoffDays + m.timeoffDays,
        vacationDays: acc.vacationDays + m.vacationDays,
        decreeDays: acc.decreeDays + m.decreeDays,
      }),
      createEmptyMonthRow(null)
    )
  )

  // Грузим все 12 месяцев выбранного года параллельно — бэк отдаёт
  // статистику только помесячно (getStatistics), агрегата за год нет.
  const loadTimesheet = async () => {
    if (!employeeId.value || timesheetUnavailable.value) {
      timesheetMonths.value = []
      return
    }

    isLoadingTimesheet.value = true
    const gender = parseGenderId(profile.value)
    const requestedYear = timesheetYear.value

    try {
      const results = await Promise.allSettled(
        Array.from({ length: 12 }, (_, i) =>
          getStatistics(employeeId.value, i + 1, requestedYear, gender)
        )
      )

      // Год мог смениться, пока летели запросы — не затираем более свежий выбор.
      if (requestedYear !== timesheetYear.value) return

      timesheetMonths.value = results.map((result, index) => {
        const month = index + 1
        if (result.status !== 'fulfilled' || !result.value) {
          return createEmptyMonthRow(month)
        }

        const data = result.value
        return {
          month,
          standardHours: data.hours?.standardHours ?? 0,
          totalHours: data.hours?.totalHours ?? 0,
          standardWorkDays: data.workDays?.standardWorkDays ?? 0,
          totalWorkDays: data.workDays?.totalWorkDays ?? 0,
          medicalDays: data.medicalDays?.count ?? 0,
          timeoffDays: data.timeoffDays?.count ?? 0,
          vacationDays: data.vacationDays?.count ?? 0,
          decreeDays: data.decreeDays?.count ?? 0,
        }
      })
    } finally {
      if (requestedYear === timesheetYear.value) isLoadingTimesheet.value = false
    }
  }

  // Итог по отпускам за показанные годы — строкой снизу таблицы.
  const vacationYearlyTotals = computed(() =>
    vacationYearlyStats.value.reduce(
      (acc, y) => ({
        used: acc.used + y.used,
        pending: acc.pending + y.pending,
        free: acc.free + y.free,
        count: acc.count + y.count,
      }),
      { used: 0, pending: 0, free: 0, count: 0 }
    )
  )

  // Даты приёма на работу пока нигде нет (появится позже в другом сервисе) —
  // до тех пор считаем год "рабочим", если по нему есть реальная активность
  // в табеле (часы/дни > 0 хоть в одном месяце). Это эвристика, не факт: год
  // без единого отработанного часа (например, декрет весь год) тоже под неё
  // попадёт как "не рабочий" — компромисс, о котором предупреждали заранее.
  const fetchYearWorkActivity = async (id, year, gender) => {
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) => getStatistics(id, i + 1, year, gender))
    )
    return results.some(
      (r) =>
        r.status === 'fulfilled' &&
        r.value &&
        ((r.value.hours?.totalHours ?? 0) > 0 || (r.value.workDays?.totalWorkDays ?? 0) > 0)
    )
  }

  // Баланс + количество заявок за каждый "рабочий" год из последних
  // VACATION_STATS_YEARS_COUNT.
  const loadVacationYearlyStats = async () => {
    if (!employeeId.value) return

    isLoadingVacationStats.value = true
    const requestedId = employeeId.value
    const nowYear = new Date().getFullYear()
    const gender = parseGenderId(profile.value)
    // Новые сверху: [текущий, текущий-1, ..., текущий-(N-1)]
    const years = Array.from({ length: VACATION_STATS_YEARS_COUNT }, (_, i) => nowYear - i)

    try {
      const results = await Promise.allSettled(
        years.flatMap((y) => [
          getVacationStats(y, requestedId),
          getVacationsByYear(y, requestedId),
          // Текущий год показываем всегда — проверять его активность незачем
          // (экономим 12 запросов). Без пола норму не посчитать вообще —
          // тогда не фильтруем по активности, а не прячем всё подряд.
          gender && y !== nowYear
            ? fetchYearWorkActivity(requestedId, y, gender)
            : Promise.resolve(null),
        ])
      )

      // Сотрудника сменили, пока летели запросы — не затираем более свежие данные.
      if (requestedId !== employeeId.value) return

      vacationYearlyStats.value = years
        .map((y, i) => {
          const statsResult = results[i * 3]
          const listResult = results[i * 3 + 1]
          const activityResult = results[i * 3 + 2]
          const stats =
            statsResult.status === 'fulfilled' && statsResult.value
              ? statsResult.value
              : createEmptyVacationStats()

          // null (текущий год/нет пола/запрос упал) — активность неизвестна,
          // тогда год не прячем, чтобы не потерять реальные данные из-за
          // сетевой ошибки или отсутствия пола у профиля.
          const hasActivity =
            activityResult?.status === 'fulfilled' && activityResult.value !== null
              ? activityResult.value
              : true

          return {
            year: y,
            used: stats.used ?? 0,
            pending: stats.pending ?? 0,
            free: stats.free ?? 0,
            count: listResult.status === 'fulfilled' ? (listResult.value ?? []).length : 0,
            hasActivity,
          }
        })
        .filter((row) => row.year === nowYear || row.hasActivity)
    } finally {
      if (requestedId === employeeId.value) isLoadingVacationStats.value = false
    }
  }

  const load = async (id) => {
    employeeId.value = id
    isLoading.value = true
    isLoaded.value = false

    // Табель — отдельная вкладка со своей навигацией по годам; при переходе
    // на другого сотрудника сбрасываем на текущий год, иначе останется год,
    // который листал у предыдущего.
    timesheetYear.value = new Date().getFullYear()
    timesheetMonths.value = []
    vacationYearlyStats.value = []

    if (!userStore.usersAll.length) {
      await userStore.userAllFetch()
    }

    const gender = parseGenderId(profile.value)
    const now = new Date()

    const [monthResult, vacStatsResult, vacListResult, sickResult, employeesResult] =
      await Promise.allSettled([
        gender
          ? getStatistics(id, now.getMonth() + 1, year.value, gender)
          : Promise.resolve(null),
        getVacationStats(year.value, id),
        getVacationsByYear(year.value, id),
        getSickLeavesByYear(year.value, id),
        getInternalEmployees(),
      ])

    monthStats.value =
      monthResult.status === 'fulfilled' && monthResult.value
        ? monthResult.value
        : createEmptyMonthStats()

    vacationStats.value =
      vacStatsResult.status === 'fulfilled' && vacStatsResult.value
        ? vacStatsResult.value
        : createEmptyVacationStats()

    vacations.value = vacListResult.status === 'fulfilled' ? vacListResult.value ?? [] : []
    sickLeaves.value = sickResult.status === 'fulfilled' ? sickResult.value ?? [] : []

    if (employeesResult.status === 'fulfilled') {
      const flat = flattenInternalEmployees(employeesResult.value)
      directoryEntry.value = flat.find((e) => e.user_id === id) ?? null
    } else {
      directoryEntry.value = null
    }

    isLoading.value = false
    isLoaded.value = true
  }

  const reset = () => {
    employeeId.value = null
    monthStats.value = createEmptyMonthStats()
    vacationStats.value = createEmptyVacationStats()
    vacations.value = []
    sickLeaves.value = []
    directoryEntry.value = null
    isLoaded.value = false
    timesheetYear.value = new Date().getFullYear()
    timesheetMonths.value = []
    vacationYearlyStats.value = []
  }

  return {
    employeeId,
    year,
    isLoading,
    isLoaded,
    profile,
    fullName,
    initials,
    directoryEntry,
    monthStats,
    vacationStats,
    vacations,
    sickLeaves,
    todayStatus,
    nextVacation,
    sickDaysThisYear,
    recentRequests,
    load,
    reset,

    // Табель
    timesheetYear,
    timesheetMonths,
    timesheetTotals,
    isLoadingTimesheet,
    timesheetUnavailable,
    loadTimesheet,

    // Отпуска
    vacationYearlyStats,
    vacationYearlyTotals,
    isLoadingVacationStats,
    loadVacationYearlyStats,
  }
})
