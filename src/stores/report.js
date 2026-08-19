import { getInternalEmployees } from '@/services/reference.api'
import { getStatistics } from '@/services/userTimeEntries.api'
import { flattenInternalEmployees, parseGenderId } from '@/utils/user.utils'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useUserStore } from './user'

// Личная статистика (за себя) отсюда убрана — страница /report теперь
// доступна только с calendar.all:read (см. router/index.js), а свою
// статистику сотрудник смотрит на карточке сотрудника (/home → вкладка
// «Табель», stores/worker.js). Тут остаётся только сводная таблица по всем.
export const useReportStore = defineStore('report', () => {
  const currentDate = shallowRef(new Date())
  const userStore = useUserStore()

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
      const flat = flattenInternalEmployees(employeesResult.value)

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
      const fullName = `${user.surname} ${user.name} ${user.patronymic}`
      return {
        id: user.id,
        name: fullName,
        department: departmentMap.value.get(fullName.trim()) ?? '',
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

  return {
    fetchAllStatistics,
    allUsersStatistics,
    departments,
    currentDate,
    isLoadingAll,
  }
})
