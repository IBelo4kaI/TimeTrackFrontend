// stores/calendar.store.js
import { getCalendarDays } from '@/services/calendar.api'
import {
  createUserTimeEntry,
  deleteUserTimeEntry,
  updateUserTimeEntry,
  getStatistics,
} from '@/services/userTimeEntries.api'
import {
  getMyWorkStandards,
  getStandardsByYear,
} from '@/services/workStandard.api'
import {
  getFirstDateOfMonth,
  getLastDateOfMonth,
  getMonthYearName,
} from '@/utils/calendar.utils'
import {
  plannedMonthHours,
  vacationNormHours,
} from '@/utils/plannedHours.utils'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  generateNextMonthDays,
  generatePrevMonthDays,
} from '../helpers/calendar.helpers'
import { useDayTypesStore } from './dayTypes'
import { useNotificationStore } from './notification'
import { useSelectingStore } from './selecting'
import { useUserStore } from './user'
import { parseDate } from '@/utils/date.utils'
import { parseGenderId } from '@/utils/user.utils'

export const useCalendarStore = defineStore('calendar', () => {
  // State
  const data = ref([])
  const statsData = ref(null)
  // work_standards с user_id = просматриваемый сотрудник, за текущий год —
  // для "Плановое кол-во часов" (см. utils/plannedHours.utils.js).
  const individualStandards = ref([])
  const selectedUserId = shallowRef(null)
  const selectedUser = shallowRef(null)
  const prevMonthDays = shallowRef([])
  const nextMonthDays = shallowRef([])
  const currentDate = shallowRef(new Date())
  const isLoading = shallowRef(false)
  const hoveredBirthday = ref(null)

  const userStore = useUserStore()
  const dayTypesStore = useDayTypesStore()

  // Init
  const init = async () => {
    selectedUser.value = userStore.user
    selectedUserId.value = userStore.user.id
    await initialFetch()
  }

  // null — у сотрудника не указан пол, норму бэк посчитать не может
  const fetchStatistics = async (userId, month, year) => {
    const user =
      selectedUser.value?.id === userId
        ? selectedUser.value
        : userStore.usersAll.find((u) => u.id === userId)

    const genderId = parseGenderId(user)
    if (!genderId) return null

    return getStatistics(userId, month, year, genderId)
  }

  // Индивидуальный график просматриваемого сотрудника за год — свой смотрим
  // через /mine (доступно всем), чужой — best-effort через общий /year
  // (доступен только с work_standards:read, т.е. админам; без прав просто
  // считаем, что индивидуального графика нет).
  const fetchIndividualStandards = async (userId, year) => {
    try {
      if (userId === userStore.user?.id) {
        return (await getMyWorkStandards(year)) ?? []
      }
      const all = (await getStandardsByYear(year)) ?? []
      return all.filter((s) => s.userId?.Valid && s.userId.String === userId)
    } catch {
      return []
    }
  }

  // Номер последней загрузки — ответы устаревших загрузок отбрасываем
  let fetchSeq = 0

  const initialFetch = async () => {
    const seq = ++fetchSeq
    // Выделение относится к старым дням — при перезагрузке сбрасываем
    useSelectingStore().clearSelection()
    isLoading.value = true

    const userId = selectedUserId.value
    if (!userId) {
      data.value = []
      prevMonthDays.value = []
      nextMonthDays.value = []
      statsData.value = null
      individualStandards.value = []
      isLoading.value = false
      return
    }

    const month = currentMonth.value
    const year = currentYear.value
    const first = firstDateOfMonth.value
    const last = lastDateOfMonth.value

    try {
      const [result, stats, standards] = await Promise.all([
        getCalendarDays(month, year, userId),
        // Статистика вторична — её сбой не должен прятать сам календарь
        fetchStatistics(userId, month, year).catch(() => null),
        fetchIndividualStandards(userId, year),
      ])
      if (seq !== fetchSeq) return

      data.value = result.days ?? []
      prevMonthDays.value = generatePrevMonthDays(first)
      nextMonthDays.value = generateNextMonthDays(last)
      statsData.value = stats
      individualStandards.value = standards
    } catch (error) {
      if (seq !== fetchSeq) return
      console.error('Ошибка загрузки календаря:', error)
      data.value = []
      statsData.value = null
      useNotificationStore().addNotification(
        'Не удалось загрузить календарь',
        'error'
      )
    } finally {
      if (seq === fetchSeq) isLoading.value = false
    }
  }

  // Computed
  const currentMonthYearName = computed(() => {
    return getMonthYearName(currentDate.value)
  })

  const firstDateOfMonth = computed(() =>
    getFirstDateOfMonth(currentDate.value)
  )

  const lastDateOfMonth = computed(() => getLastDateOfMonth(currentDate.value))

  const currentMonth = computed(() => currentDate.value.getMonth() + 1)

  const currentYear = computed(() => currentDate.value.getFullYear())

  const calendarDays = computed(() => {
    return data.value
  })

  // Actions - Навигация

  const updateDay = async (daysUpdate, daysCreate) => {
    if (daysUpdate.entities.length > 0) {
      await updateUserTimeEntry(daysUpdate)
    }
    if (daysCreate.entities.length > 0) {
      await createUserTimeEntry(daysCreate)
    }
    if (daysUpdate.entities.length > 0 || daysCreate.entities.length > 0)
      await initialFetch()
  }

  const deleteDay = async (daysDelete) => {
    if (daysDelete.entryDate.length > 0) {
      await deleteUserTimeEntry(daysDelete)
      await initialFetch()
    }
  }

  const hoverBirthday = (dateHover) => {
    const d = parseDate(dateHover)
    hoveredBirthday.value = d.getDate()
  }

  const resetHoveredBirthday = () => {
    hoveredBirthday.value = null
  }

  const workingHours = computed(() =>
    statsData.value
      ? statsData.value.hours
      : { totalHours: 0, standardHours: 0 }
  )

  const workingDays = computed(() =>
    statsData.value
      ? statsData.value.workDays
      : { totalWorkDays: 0, standardWorkDays: 0 }
  )

  // selectedUser не всегда синхронизирован с selectedUserId (например, при
  // выборе другого сотрудника через Autocomplete в ControlsCalendar — тот
  // меняет только selectedUserId) — тут разрешаем реального просматриваемого
  // пользователя один раз, для plannedHours/effectiveStandardHours ниже.
  const viewedUser = computed(() =>
    selectedUser.value?.id === selectedUserId.value
      ? selectedUser.value
      : userStore.usersAll.find((u) => u.id === selectedUserId.value)
  )

  const viewedGenderId = computed(() => parseGenderId(viewedUser.value))

  // По месяцу И полу: форма настроек заводит на сотрудника обе гендерные
  // строки на месяц (см. StandardSettings.vue) — без фильтра по полу можно
  // случайно подхватить не ту, если заполнены обе.
  const viewedIndividualStandard = computed(() =>
    individualStandards.value.find(
      (s) => s.month === currentMonth.value && s.gender === viewedGenderId.value
    )
  )

  // Плановое кол-во часов за месяц: уже отработано (факт по дням с
  // отметкой) + плановая отработка (норма по дням без отметки) — см.
  // utils/plannedHours.utils.js. null, если пол просматриваемого
  // сотрудника неизвестен (норму посчитать не из чего).
  const plannedHours = computed(() => {
    if (!viewedGenderId.value) return null
    return plannedMonthHours(
      calendarDays.value,
      viewedGenderId.value,
      viewedIndividualStandard.value,
      dayTypesStore.getDayTypeIdByName('preholiday')
    )
  })

  // Норма месяца (с бэка) за вычетом нормы дней отпуска — иначе отпуск
  // всегда считался бы недоработкой в "Недоработка/Переработка" на
  // странице календаря, хотя остальные дни отработаны как надо.
  const effectiveStandardHours = computed(() => {
    const standard = workingHours.value.standardHours
    if (!viewedGenderId.value) return standard

    const vacationTypeId = dayTypesStore.getDayTypeIdByName('vacation')
    const vacationNorm = vacationNormHours(
      calendarDays.value,
      vacationTypeId,
      viewedGenderId.value,
      viewedIndividualStandard.value,
      dayTypesStore.getDayTypeIdByName('preholiday')
    )
    return Math.max(0, standard - vacationNorm)
  })

  const otherDays = computed(() =>
    statsData.value
      ? {
          vacationDays: statsData.value.vacationDays,
          medicalDays: statsData.value.medicalDays,
          timeoffDays: statsData.value.timeoffDays,
          decreeDays: statsData.value.decreeDays,
        }
      : {
          vacationDays: { count: 0 },
          medicalDays: { count: 0 },
          timeoffDays: { count: 0 },
          decreeDays: { count: 0 },
        }
  )

  return {
    // State
    currentDate,
    isLoading,
    prevMonthDays,
    nextMonthDays,
    data,
    statsData,
    individualStandards,
    selectedUserId,
    selectedUser,
    hoveredBirthday,

    // Computed
    currentMonth,
    currentYear,
    currentMonthYearName,
    firstDateOfMonth,
    lastDateOfMonth,
    calendarDays,
    workingHours,
    workingDays,
    otherDays,
    plannedHours,
    effectiveStandardHours,

    // Actions
    updateDay,
    deleteDay,
    initialFetch,
    init,
    hoverBirthday,
    resetHoveredBirthday,
  }
})
