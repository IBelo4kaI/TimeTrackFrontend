import { getInternalEmployees } from '@/services/reference.api'
import { getStatistics } from '@/services/userTimeEntries.api'
import { flattenInternalEmployees, parseGenderId } from '@/utils/user.utils'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useNotificationStore } from './notification'
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
  // Map: user_id → department name (из справочника сотрудников)
  const departmentMap = ref(new Map())

  // Номер последней загрузки — ответы устаревших загрузок отбрасываем
  let fetchSeq = 0

  const fetchAllStatistics = async () => {
    if (!userStore.usersAll.length) return

    const seq = ++fetchSeq
    isLoadingAll.value = true
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()

    try {
      const [statsResults, employeesResult] = await Promise.allSettled([
        Promise.all(
          userStore.usersAll.map(async (user) => {
            const gender = parseGenderId(user)
            // Без пола норму бэк посчитать не может — строка с прочерками
            if (!gender) return { user, data: null, unavailable: true }
            try {
              const stat = await getStatistics(user.id, month, year, gender)
              return { user, data: stat, unavailable: false }
            } catch {
              return { user, data: null, unavailable: false, failed: true }
            }
          })
        ),
        getInternalEmployees(),
      ])
      if (seq !== fetchSeq) return

      allUsersData.value =
        statsResults.status === 'fulfilled' ? statsResults.value : []

      const requested = allUsersData.value.filter((r) => !r.unavailable)
      if (requested.length && requested.every((r) => r.failed)) {
        useNotificationStore().addNotification(
          'Не удалось загрузить статистику',
          'error'
        )
      }

      if (employeesResult.status === 'fulfilled') {
        const flat = flattenInternalEmployees(employeesResult.value)

        // По user_id, как и в карточке сотрудника (stores/worker.js)
        const map = new Map()
        const deptSet = new Set()
        flat.forEach((emp) => {
          if (emp?.user_id && emp?.department) {
            map.set(emp.user_id, emp.department)
            deptSet.add(emp.department)
          }
        })
        departmentMap.value = map
        departments.value = [...deptSet].sort()
      }
    } finally {
      if (seq === fetchSeq) isLoadingAll.value = false
    }
  }

  const allUsersStatistics = computed(() =>
    allUsersData.value
      .map(({ user, data, unavailable }) => ({
        id: user.id,
        name: [user.surname, user.name, user.patronymic]
          .filter(Boolean)
          .join(' '),
        department: departmentMap.value.get(user.id) ?? '',
        unavailable,
        standardHours: data?.hours?.standardHours ?? 0,
        totalHours: data?.hours?.totalHours ?? 0,
        standardWorkDays: data?.workDays?.standardWorkDays ?? 0,
        totalWorkDays: data?.workDays?.totalWorkDays ?? 0,
        medicalDays: data?.medicalDays?.count ?? 0,
        timeoffDays: data?.timeoffDays?.count ?? 0,
        vacationDays: data?.vacationDays?.count ?? 0,
        decreeDays: data?.decreeDays?.count ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  )

  return {
    fetchAllStatistics,
    // Под этим именем зовёт общий ControlsCalendar при смене месяца
    initialFetch: fetchAllStatistics,
    allUsersStatistics,
    departments,
    currentDate,
    isLoadingAll,
  }
})
