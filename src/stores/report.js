import { getTimesheetDirectory, getTimesheets, setTimesheetApproval } from '@/services/timesheets.api'
import { flattenInternalEmployees } from '@/utils/user.utils'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { useNotificationStore } from './notification'
import { useUserStore } from './user'

export const useReportStore = defineStore('report', () => {
  const currentDate = shallowRef(new Date())
  const userStore = useUserStore()
  const notifications = useNotificationStore()
  const allUsersData = ref([])
  const isLoadingAll = shallowRef(false)
  const departments = ref([])
  const departmentMap = ref(new Map())
  const loadError = ref('')
  const pendingDecisions = ref(new Set())
  const canReadAll = computed(() => userStore.hasPermission('calendar.all', 'read'))
  let fetchSeq = 0
  let loadedPeriod = ''

  const periodKey = () => `${currentDate.value.getFullYear()}-${currentDate.value.getMonth() + 1}`

  const fetchAllStatistics = async () => {
    const seq = ++fetchSeq
    const period = periodKey()
    isLoadingAll.value = true
    loadError.value = ''
    loadedPeriod = ''
    allUsersData.value = []
    departmentMap.value = new Map()
    departments.value = []
    const month = currentDate.value.getMonth() + 1
    const year = currentDate.value.getFullYear()
    try {
      const [timesheets, employees] = await Promise.allSettled([
        getTimesheets(year, month),
        canReadAll.value ? getTimesheetDirectory() : Promise.resolve([]),
      ])
      if (seq !== fetchSeq || period !== periodKey()) return false
      if (timesheets.status === 'rejected') throw timesheets.reason
      if (!Array.isArray(timesheets.value)) throw new Error('Некорректный ответ сервера табелей')
      allUsersData.value = timesheets.value
      loadedPeriod = period
      if (canReadAll.value && employees.status === 'fulfilled') {
        const map = new Map()
        flattenInternalEmployees(employees.value).forEach((employee) => {
          if (typeof employee?.user_id === 'string' && typeof employee?.department === 'string' && employee.department) {
            map.set(employee.user_id, employee.department)
          }
        })
        departmentMap.value = map
        departments.value = [...new Set(timesheets.value.map((row) => map.get(row.userId)).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b, 'ru'))
      }
      return true
    } catch (error) {
      if (seq !== fetchSeq || period !== periodKey()) return false
      allUsersData.value = []
      loadedPeriod = ''
      loadError.value = error.response?.status === 403
        ? 'Нет доступа к табелям. Проверьте назначение руководителем отдела.'
        : 'Не удалось загрузить табели. Попробуйте обновить данные.'
      notifications.addNotification(loadError.value, 'error')
      return false
    } finally {
      if (seq === fetchSeq) isLoadingAll.value = false
    }
  }

  const authorName = (id) => {
    if (!id) return ''
    const author = userStore.user?.id === id ? userStore.user
      : allUsersData.value.find((row) => row.userId === id)
        ?? (canReadAll.value ? userStore.usersAll.find((user) => user.id === id) : null)
    return author ? [author.surname, author.name, author.patronymic].filter(Boolean).join(' ') || id : id
  }

  const allUsersStatistics = computed(() => allUsersData.value.map((row) => {
    const data = row.statistics
    return {
      id: row.userId,
      name: [row.surname, row.name, row.patronymic].filter(Boolean).join(' ') || row.userId,
      department: departmentMap.value.get(row.userId) ?? '',
      unavailable: row.statisticsUnavailable || !data,
      status: row.status,
      revision: row.revision,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt,
      approvedByName: authorName(row.approvedBy),
      canApprove: row.canApprove === true,
      standardHours: data?.hours?.standardHours ?? 0,
      totalHours: data?.hours?.totalHours ?? 0,
      standardWorkDays: data?.workDays?.standardWorkDays ?? 0,
      totalWorkDays: data?.workDays?.totalWorkDays ?? 0,
      officeDays: data?.officeDays?.count ?? 0,
      remoteDays: data?.remoteDays?.count ?? 0,
      medicalDays: data?.medicalDays?.count ?? 0,
      timeoffDays: data?.timeoffDays?.count ?? 0,
      vacationDays: data?.vacationDays?.count ?? 0,
      decreeDays: data?.decreeDays?.count ?? 0,
    }
  }).sort((a, b) => a.name.localeCompare(b.name, 'ru')))

  const setApproval = async (id, approve) => {
    const period = periodKey()
    const row = allUsersData.value.find((item) => item.userId === id)
    const key = `${period}:${id}`
    if (isLoadingAll.value || loadedPeriod !== period || pendingDecisions.value.has(key)
      || row?.canApprove !== true || !Number.isSafeInteger(row.revision) || row.revision < 0) return
    pendingDecisions.value.add(key)
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth() + 1
    try {
      await setTimesheetApproval(id, year, month, row.revision, approve)
      notifications.addNotification(approve ? 'Табель подтверждён' : 'Подтверждение табеля снято', 'success')
      if (period === periodKey()) await fetchAllStatistics()
    } catch (error) {
      if (error.response?.status === 409) {
        const refreshed = period === periodKey() ? await fetchAllStatistics() : false
        notifications.addNotification(refreshed
          ? 'Табель изменился. Данные обновлены — проверьте их перед повторным подтверждением.'
          : 'Табель изменился. Загрузите его актуальные данные перед повторным подтверждением.', 'warning')
      } else {
        notifications.addNotification(error.message || 'Не удалось сохранить подтверждение табеля', 'error')
        if (period === periodKey()) await fetchAllStatistics()
      }
    } finally {
      pendingDecisions.value.delete(key)
    }
  }

  const isDeciding = (id) => pendingDecisions.value.has(`${periodKey()}:${id}`)

  return {
    fetchAllStatistics,
    initialFetch: fetchAllStatistics,
    allUsersStatistics,
    departments,
    currentDate,
    isLoadingAll,
    loadError,
    canReadAll,
    setApproval,
    isDeciding,
  }
})
