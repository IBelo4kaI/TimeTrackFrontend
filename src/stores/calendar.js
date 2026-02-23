// stores/calendar.store.js
import { getCalendarDays } from '@/services/calendar.api'
import {
  createUserTimeEntry,
  deleteUserTimeEntry,
  updateUserTimeEntry,
} from '@/services/userTimeEntries.api'
import {
  getFirstDateOfMonth,
  getLastDateOfMonth,
  getMonthYearName,
} from '@/utils/calendar.utils'
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
  const selectedUserId = shallowRef(null)
  const selectedUser = shallowRef(null)
  const prevMonthDays = shallowRef([])
  const nextMonthDays = shallowRef([])
  const currentDate = shallowRef(new Date())
  const isLoading = shallowRef(false)

  const userStore = useUserStore()
  // Init
  const init = async () => {
    selectedUser.value = userStore.user
    selectedUserId.value = userStore.user.id
    console.log(selectedUser, selectedUserId)
    await initialFetch()
  }

  const initialFetch = async () => {
    isLoading.value = true

    const result = await getCalendarDays(
      currentMonth.value,
      currentYear.value,
      selectedUserId.value
    )
    data.value = result.days

    prevMonthDays.value = generatePrevMonthDays(firstDateOfMonth.value)
    nextMonthDays.value = generateNextMonthDays(lastDateOfMonth.value)

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

  watch(
    selectedUserId,
    async () => {
      if (!isLoading.value) await initialFetch()
    },
    { immediate: false }
  )

  watch(
    currentDate,
    async () => {
      if (!isLoading.value) await initialFetch()
    },
    { immediate: false }
  )

  return {
    // State
    currentDate,
    isLoading,
    prevMonthDays,
    nextMonthDays,
    data,
    selectedUserId,
    selectedUser,

    // Computed
    currentMonth,
    currentYear,
    currentMonthYearName,
    firstDateOfMonth,
    lastDateOfMonth,
    calendarDays,

    // Actions
    updateDay,
    deleteDay,
    initialFetch,
    init,
  }
})
