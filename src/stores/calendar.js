// stores/calendar.store.js
import { getCalendarDays } from '@/services/calendar.api'
import {
  createUserTimeEntry,
  deleteUserTimeEntry,
  updateUserTimeEntry,
  getStatistics,
} from '@/services/userTimeEntries.api'
import { getMyWorkStandards, getStandardsByYear } from '@/services/workStandard.api'
import {
  getFirstDateOfMonth,
  getLastDateOfMonth,
  getMonthYearName,
} from '@/utils/calendar.utils'
import { plannedMonthHours } from '@/utils/plannedHours.utils'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import {
  generateNextMonthDays,
  generatePrevMonthDays,
} from '../helpers/calendar.helpers'
import { useUserStore } from './user'

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

  const userStore = useUserStore()

  const parseGenderId = (user) => {
    const rawGender = user?.gender?.id ?? user?.genderId ?? user?.gender
    if (typeof rawGender === 'number') return rawGender
    if (typeof rawGender === 'string') {
      const normalizedGender = rawGender.trim().toLowerCase()
      if (['2', 'female', 'f', 'жен', 'женский'].includes(normalizedGender))
        return 2
      if (['1', 'male', 'm', 'муж', 'мужской'].includes(normalizedGender))
        return 1
    }
    return null
  }

  // Init
  const init = async () => {
    selectedUser.value = userStore.user
    selectedUserId.value = userStore.user.id
    await initialFetch()
  }

  const fetchStatistics = async () => {
    if (!selectedUserId.value) return

    const user =
      selectedUser.value?.id === selectedUserId.value
        ? selectedUser.value
        : userStore.usersAll.find((u) => u.id === selectedUserId.value)

    const genderId = parseGenderId(user)
    if (!genderId) return

    statsData.value = await getStatistics(
      selectedUserId.value,
      currentMonth.value,
      currentYear.value,
      genderId
    )
  }

  // Индивидуальный график просматриваемого сотрудника за текущий год —
  // свой смотрим через /mine (доступно всем), чужой — best-effort через
  // общий /year (доступен только с work_standards:read, т.е. админам;
  // без прав просто считаем, что индивидуального графика нет).
  const fetchIndividualStandards = async () => {
    if (!selectedUserId.value) {
      individualStandards.value = []
      return
    }

    try {
      if (selectedUserId.value === userStore.user?.id) {
        individualStandards.value = (await getMyWorkStandards(currentYear.value)) ?? []
      } else {
        const all = (await getStandardsByYear(currentYear.value)) ?? []
        individualStandards.value = all.filter(
          (s) => s.userId?.Valid && s.userId.String === selectedUserId.value
        )
      }
    } catch {
      individualStandards.value = []
    }
  }

  const initialFetch = async () => {
    isLoading.value = true

    if (!selectedUserId.value) {
      data.value = []
      prevMonthDays.value = []
      nextMonthDays.value = []
      isLoading.value = false
      return
    }

    const result = await getCalendarDays(
      currentMonth.value,
      currentYear.value,
      selectedUserId.value
    )
    data.value = result.days
    console.log(data.value, prevMonthDays.value, nextMonthDays.value)
    prevMonthDays.value = generatePrevMonthDays(firstDateOfMonth.value)
    nextMonthDays.value = generateNextMonthDays(lastDateOfMonth.value)

    await fetchStatistics()
    await fetchIndividualStandards()

    isLoading.value = false
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
      const res = await updateUserTimeEntry(daysUpdate)
      // updateDayInReports(res)
    }
    if (daysCreate.entities.length > 0) {
      const res = await createUserTimeEntry(daysCreate)
      // updateDayInReports(res)
    }
    if (daysUpdate.entities.length > 0 || daysCreate.entities.length > 0)
      initialFetch()
  }

  const deleteDay = async (daysDelete) => {
    if (daysDelete.entryDate.length > 0) {
      const res = await deleteUserTimeEntry(daysDelete)
      initialFetch()
      // updateDayInReports(res)
    }
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

  // Плановое кол-во часов за месяц: уже отработано (факт по дням с
  // отметкой) + плановая отработка (норма по дням без отметки) — см.
  // utils/plannedHours.utils.js. null, если пол просматриваемого
  // сотрудника неизвестен (норму посчитать не из чего).
  const plannedHours = computed(() => {
    // selectedUser не всегда синхронизирован с selectedUserId (например,
    // при выборе другого сотрудника через Autocomplete в ControlsCalendar —
    // тот меняет только selectedUserId) — тот же обход, что в fetchStatistics.
    const user =
      selectedUser.value?.id === selectedUserId.value
        ? selectedUser.value
        : userStore.usersAll.find((u) => u.id === selectedUserId.value)

    const genderId = parseGenderId(user)
    if (!genderId) return null

    const individualStandard = individualStandards.value.find(
      (s) => s.month === currentMonth.value
    )
    return plannedMonthHours(calendarDays.value, genderId, individualStandard)
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

    // Actions
    updateDay,
    deleteDay,
    initialFetch,
    init,
  }
})
