import { getInternalEmployees } from '@/services/reference.api'
import { getStatistics } from '@/services/userTimeEntries.api'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'
import { useUserStore } from './user'

export const useReportStore = defineStore('report', () => {
  const data = ref(null)
  const selectedUser = shallowRef(null)
  const selectedUserId = shallowRef(null)
  const currentDate = shallowRef(new Date())
  const isLoading = shallowRef(false)
  const userStore = useUserStore()

  const parseGenderId = (user) => {
    const rawGender = user?.gender?.id ?? user?.genderId ?? user?.gender

    if (typeof rawGender === 'number') return rawGender
    if (typeof rawGender === 'string') {
      const normalizedGender = rawGender.trim().toLowerCase()
      if (['2', 'female', 'f', 'жен', 'женский'].includes(normalizedGender)) {
        return 2
      }
      if (['1', 'male', 'm', 'муж', 'мужской'].includes(normalizedGender)) {
        return 1
      }
    }

    return null
  }

  const init = async () => {
    setUser(userStore.user)
  }

  const initialFetch = async () => {
    if (!selectedUserId.value) return

    if (
      !selectedUser.value ||
      selectedUser.value?.id !== selectedUserId.value
    ) {
      selectedUser.value = userStore.usersAll.find(
        (u) => u.id === selectedUserId.value
      )
    }

    const genderId = parseGenderId(selectedUser.value)
    if (!genderId) return

    isLoading.value = true
    data.value = await getStatistics(
      selectedUserId.value,
      currentDate.value.getMonth() + 1,
      currentDate.value.getFullYear(),
      genderId
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
        vacationDays: { count: 0 },
        medicalDays: { count: 0 },
        timeoffDays: { count: 0 },
        decreeDays: { count: 0 },
      }
    }
  })

  // --- All users statistics ---

  const allUsersData = ref([])
  const isLoadingAll = shallowRef(false)
  const departments = ref([])
  // Map: "Фамилия Имя" → department name (matched from reference API)
  const departmentMap = ref(new Map())

  const fetchAllStatistics = async () => {
    if (!userStore.usersAll.length) return

    isLoadingAll.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()

    const [statsResults, employeesResult] = await Promise.allSettled([
      Promise.all(
        userStore.usersAll
          .filter((u) => parseGenderId(u))
          .map(async (user) => {
            try {
              const stat = await getStatistics(
                user.id,
                month,
                year,
                parseGenderId(user)
              )
              return { user, data: stat }
            } catch {
              return { user, data: null }
            }
          })
      ),
      getInternalEmployees(),
    ])

    allUsersData.value =
      statsResults.status === 'fulfilled' ? statsResults.value : []

    if (employeesResult.status === 'fulfilled') {
      const raw = employeesResult.value ?? []
      const flat = Array.isArray(raw)
        ? raw.flatMap((item) =>
            Array.isArray(item?.employees) ? item.employees : [item]
          )
        : []

      const map = new Map()
      const deptSet = new Set()
      flat.forEach((emp) => {
        if (emp?.full_name && emp?.department) {
          map.set(emp.full_name.trim(), emp.department)
          deptSet.add(emp.department)
        }
      })
      departmentMap.value = map
      departments.value = [...deptSet].sort()
    }

    isLoadingAll.value = false
  }

  const allUsersStatistics = computed(() =>
    allUsersData.value.map(({ user, data }) => {
      const fullName = `${user.surname} ${user.name}`
      return {
        id: user.id,
        name: fullName,
        department: departmentMap.value.get(fullName) ?? '',
        standardHours: data?.hours?.standardHours ?? 0,
        totalHours: data?.hours?.totalHours ?? 0,
        standardWorkDays: data?.workDays?.standardWorkDays ?? 0,
        totalWorkDays: data?.workDays?.totalWorkDays ?? 0,
        medicalDays: data?.medicalDays?.count ?? 0,
        timeoffDays: data?.timeoffDays?.count ?? 0,
        vacationDays: data?.vacationDays?.count ?? 0,
        decreeDays: data?.decreeDays?.count ?? 0,
      }
    })
  )

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
    fetchAllStatistics,
    setUser,
    otherDays,
    workingDays,
    workingHours,
    allUsersStatistics,
    departments,
    currentDate,
    data,
    selectedUser,
    selectedUserId,
    isLoading,
    isLoadingAll,
  }
})
