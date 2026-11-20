import { getTimesheets, getTimesheetMonth, getTimeEntryHistory, editTimesheetEntries, setTimesheetApproval } from '@/services/timesheets.api'
import { historyDayKey, historyId } from '@/utils/timeEntryHistory.utils'
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
  const timeHistory = ref([])
  const historyReady = ref(false)
  const historyError = ref('')
  const monthState = ref(null)
  const scopeRow = ref(null)
  const employeeRows = ref([])
  const employeesReady = ref(false)
  const employeesError = ref('')
  const mutationPending = ref(false)
  const approvalPending = ref(false)
  let loadedContext = ''
  const contextKey = () => `${selectedUserId.value}:${currentDate.value.getFullYear()}-${currentDate.value.getMonth() + 1}`

  const userStore = useUserStore()
  const dayTypesStore = useDayTypesStore()

  const canSelectEmployees = computed(() => userStore.hasPermission('calendar.all', 'read')
    || (employeesReady.value && userStore.hasPermission('department.manager', 'manage')))
  const employeeOptions = computed(() => {
    if (userStore.hasPermission('calendar.all', 'read')) return userStore.usersAll
    const own = userStore.user
    const options = new Map(own?.id ? [[own.id, own]] : [])
    if (employeesReady.value && userStore.hasPermission('department.manager', 'manage')) {
      for (const row of employeeRows.value) {
        if (!options.has(row.userId)) options.set(row.userId, {
          id: row.userId, name: row.name, surname: row.surname, patronymic: row.patronymic,
        })
      }
    }
    return [...options.values()]
  })

  const foreignCalendar = computed(() => selectedUserId.value && selectedUserId.value !== userStore.user?.id)
  const managerOperation = (action) => foreignCalendar.value
    && userStore.hasPermission('department.manager', 'manage')
    && !userStore.hasPermission('calendar.all', action)
  const isManagerCalendar = computed(() => managerOperation('edit'))
  const canApprove = computed(() => !isLoading.value && loadedContext === contextKey()
    && scopeRow.value?.userId === selectedUserId.value && scopeRow.value?.canApprove === true
    && scopeRow.value?.year === currentDate.value.getFullYear()
    && scopeRow.value?.month === currentDate.value.getMonth() + 1
    && monthState.value?.userId === selectedUserId.value
    && monthState.value?.year === currentDate.value.getFullYear()
    && monthState.value?.month === currentDate.value.getMonth() + 1
    && Number.isSafeInteger(monthState.value?.revision) && monthState.value.revision >= 0)
  const canViewTimeHistory = computed(() => {
    if (!selectedUserId.value || isLoading.value || !historyReady.value || historyError.value
      || loadedContext !== contextKey()) return false
    if (userStore.hasPermission('calendar.all', 'read')) return true
    return !!foreignCalendar.value && userStore.hasPermission('department.manager', 'manage')
      && scopeRow.value?.userId === selectedUserId.value
  })
  const historyForDay = (date) => timeHistory.value.filter((event) => historyDayKey(event.entryDate) === historyDayKey(date))
  const managerChangedDay = (date) => historyForDay(date).some((event) => event.actorType === 'manager')
  const managerDayError = (day) => {
    if (loadedContext !== contextKey() || isLoading.value || mutationPending.value || !historyReady.value || scopeRow.value?.canEdit !== true) return 'Не подтверждены права или не загружена история. Обновите календарь.'
    if (day.userTimeId && day.userTimeTypeId !== dayTypesStore.getDayTypeIdByName('work')) return 'Руководитель может изменять только рабочие записи.'
    if (day.userTimeId && historyForDay(day.date).some((event) => historyId(event.entryId) === day.userTimeId
      && (event.actorType === 'system' || ['vacation', 'sick_leave'].includes(event.source)))) return 'Этой записью управляет кадровый или системный процесс.'
    return ''
  }

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
    const context = contextKey()
    loadedContext = ''
    // Выделение относится к старым дням — при перезагрузке сбрасываем
    useSelectingStore().clearSelection()
    isLoading.value = true
    data.value = []
    statsData.value = null
    individualStandards.value = []
    prevMonthDays.value = []
    nextMonthDays.value = []
    timeHistory.value = []
    historyReady.value = false
    historyError.value = ''
    monthState.value = null
    scopeRow.value = null
    employeeRows.value = []
    employeesReady.value = false
    employeesError.value = ''

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
      const [result, stats, standards, history, state, scope] = await Promise.all([
        getCalendarDays(month, year, userId),
        // Статистика вторична — её сбой не должен прятать сам календарь
        fetchStatistics(userId, month, year).catch(() => null),
        fetchIndividualStandards(userId, year),
        getTimeEntryHistory(userId, year, month).then((rows) => ({ rows })).catch(() => null),
        getTimesheetMonth(userId, year, month).catch(() => null),
        (userStore.hasPermission('department.manager', 'manage') || userStore.hasPermission('timesheet.all', 'approve'))
          ? getTimesheets(year, month, { timeout: 10000 }).then((rows) => ({ rows })).catch(() => ({ rows: null }))
          : Promise.resolve({ rows: [] }),
      ])
      if (seq !== fetchSeq || context !== contextKey()) return

      if (!Array.isArray(result?.days)) throw new Error('Некорректный ответ календаря')
      data.value = result.days
      prevMonthDays.value = generatePrevMonthDays(first)
      nextMonthDays.value = generateNextMonthDays(last)
      statsData.value = stats ?? (Array.isArray(scope?.rows) ? scope.rows.find((row) => row?.userId === userId)?.statistics : null) ?? null
      individualStandards.value = standards
      historyReady.value = Array.isArray(history?.rows)
      timeHistory.value = historyReady.value ? history.rows : []
      historyError.value = historyReady.value ? '' : 'Не удалось загрузить историю изменений. Пометки могут быть недоступны.'
      monthState.value = state
      const validScope = Array.isArray(scope?.rows) && scope.rows.every((row) => typeof row?.userId === 'string' && row.userId)
      employeeRows.value = validScope ? scope.rows : []
      employeesReady.value = validScope
      if (!validScope && userStore.hasPermission('department.manager', 'manage')
        && !userStore.hasPermission('calendar.all', 'read')) employeesError.value = 'Не удалось загрузить доступных сотрудников. Обновите данные.'
      scopeRow.value = employeeRows.value.find((row) => row.userId === userId) ?? null
      loadedContext = context
    } catch (error) {
      if (seq !== fetchSeq || context !== contextKey()) return
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

  const setApproval = async (approve) => {
    if (!canApprove.value || approvalPending.value || mutationPending.value) return
    const context = contextKey()
    const userId = selectedUserId.value
    const year = currentDate.value.getFullYear(), month = currentDate.value.getMonth() + 1
    const revision = monthState.value.revision
    const notifications = useNotificationStore()
    approvalPending.value = true
    try {
      await setTimesheetApproval(userId, year, month, revision, approve)
      notifications.addNotification(approve ? 'Табель подтверждён' : 'Подтверждение табеля снято', 'success')
    } catch (error) {
      if (error.response?.status === 409) {
        notifications.addNotification('Табель изменился. Проверьте актуальные данные перед повторным подтверждением.', 'warning')
      } else {
        notifications.addNotification(error.message || 'Не удалось сохранить подтверждение табеля', 'error')
      }
    } finally {
      try {
        if (context === contextKey()) await initialFetch()
      } finally {
        approvalPending.value = false
      }
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

  const managerWrite = async (userId, operation, entities, comment) => {
    const reason = (comment ?? '').trim()
    if (!reason || [...reason].length > 4000) throw new Error('Укажите причину изменения: от 1 до 4000 символов.')
    if (loadedContext !== contextKey() || mutationPending.value || isLoading.value || userId !== selectedUserId.value || !historyReady.value || scopeRow.value?.canEdit !== true) throw new Error('Обновите календарь перед изменением.')
    const month = currentMonth.value, year = currentYear.value
    const workId = dayTypesStore.getDayTypeIdByName('work')
    for (const entity of entities) {
      const day = data.value.find((item) => historyDayKey(item.date) === historyDayKey(entity.entryDate))
      if (!day || managerDayError(day)) throw new Error(day ? managerDayError(day) : 'Дата не принадлежит загруженному месяцу.')
      if (operation !== 'delete' && entity.dayTypeId !== workId) throw new Error('Руководитель может записывать только тип work.')
    }
    mutationPending.value = true
    try {
      await editTimesheetEntries(userId, year, month, operation, entities, reason)
    } catch (error) {
      useNotificationStore().addNotification(error.message || 'Не удалось изменить время', 'error')
      throw error
    } finally {
      try {
        if (userId === selectedUserId.value && month === currentMonth.value && year === currentYear.value) await initialFetch()
      } finally {
        mutationPending.value = false
      }
    }
  }

  const updateDay = async (daysUpdate, daysCreate, comment) => {
    if ((managerOperation('edit') && daysUpdate.entities.length) || (managerOperation('create') && daysCreate.entities.length)) {
      if (daysUpdate.entities.length && daysCreate.entities.length) throw new Error('Выберите отдельно новые дни или существующие записи.')
      const updating = daysUpdate.entities.length > 0
      const batch = updating ? daysUpdate : daysCreate
      return managerWrite(batch.userId, updating ? 'update' : 'create', batch.entities, comment)
    }
    if (!daysUpdate.entities.length && !daysCreate.entities.length) return
    const context = contextKey()
    try {
      if (daysUpdate.entities.length > 0) await updateUserTimeEntry(daysUpdate)
      if (daysCreate.entities.length > 0) await createUserTimeEntry(daysCreate)
    } finally {
      if (context === contextKey()) await initialFetch()
    }
  }

  const deleteDay = async (daysDelete, comment) => {
    if (managerOperation('delete') && daysDelete.entryDate.length) {
      return managerWrite(daysDelete.userId, 'delete', daysDelete.entryDate.map((entryDate) => ({ entryDate })), comment)
    }
    if (!daysDelete.entryDate.length) return
    const context = contextKey()
    try {
      await deleteUserTimeEntry(daysDelete)
    } finally {
      if (context === contextKey()) await initialFetch()
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
          officeDays: statsData.value.officeDays,
          remoteDays: statsData.value.remoteDays,
          vacationDays: statsData.value.vacationDays,
          medicalDays: statsData.value.medicalDays,
          timeoffDays: statsData.value.timeoffDays,
          decreeDays: statsData.value.decreeDays,
        }
      : {
          officeDays: { count: 0 },
          remoteDays: { count: 0 },
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
    canSelectEmployees, employeeOptions, employeesError,
    hoveredBirthday,
    timeHistory, historyReady, historyError, monthState, isManagerCalendar, mutationPending,
    canApprove, approvalPending, setApproval,
    managerOperation, managerDayError, historyForDay, managerChangedDay, canViewTimeHistory,

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
