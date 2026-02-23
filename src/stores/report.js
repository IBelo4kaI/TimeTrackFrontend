import { getStatistics } from '@/services/userTimeEntries.api'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { useCalendarStore } from './calendar'
import { useUserStore } from './user'

export const useReportStore = defineStore('report', () => {
  const data = ref(null)
  const selectedUser = shallowRef(null)
  const selectedUserId = shallowRef(null)
  const currentDate = shallowRef(new Date())
  const isLoading = shallowRef(false)
  const userStore = useUserStore()

  const init = async () => {
    setUser(userStore.user)
  }

  const initialFetch = async () => {
    isLoading.value = true
    data.value = await getStatistics(
      selectedUserId.value,
      currentDate.value.getMonth() + 1,
      currentDate.value.getFullYear(),
      selectedUser.value.gender.id
    )
    isLoading.value = false
  }

  const workingHours = computed(() => {
    if (data.value) {
      return data.value.hours
    } else {
      return {
        totalHours: 0,
        standardHours: 0,
      }
    }
  })

  const workingDays = computed(() => {
    if (data.value) {
      return data.value.workDays
    } else {
      return {
        totalWorkDays: 0,
        standardWorkDays: 0,
      }
    }
  })

  const otherDays = computed(() => {
    if (data.value) {
      return {
        vacationDays: data.value.vacationDays,
        medicalDays: data.value.medicalDays,
        timeoffDays: data.value.timeoffDays,
        decreeDays: data.value.decreeDays,
      }
    } else {
      return {
        vacationDays: {
          count: 0,
        },
        medicalDays: {
          count: 0,
        },
        timeoffDays: {
          count: 0,
        },
        decreeDays: {
          count: 0,
        },
      }
    }
  })

  const setUser = (user, isFetch = true) => {
    selectedUser.value = user
    selectedUserId.value = user.id
    if (isFetch) initialFetch()
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
    init,
    initialFetch,
    setUser,
    otherDays,
    workingDays,
    workingHours,
    currentDate,
    data,
    selectedUser,
    selectedUserId,
    isLoading,
  }
})
