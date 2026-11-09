import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { getInternalEmployees } from '@/services/reference.api'
import { getActiveVacationTypes } from '@/services/vacationTypes.api'
import { getVacationById, getVacationHistory, updateVacationStatus, updateVacationType, editVacationApplication, withdrawVacation, calculateVacationDays, getVacationStats } from '@/services/vacation.api'
import { getVacationStatusMeta } from '@/utils/vacation.utils'
import { parseLocalDate } from '@/components/Vacation/VacationOther/VacationTable/vacationUtils'

export const displayTimestamp = (value) => {
  const raw = value?.Valid === false ? null : value?.Time ?? value
  return raw ? new Date(raw).toLocaleString('ru-RU') : '—'
}
export const dateOnly = (value) => String(value ?? '').slice(0, 10)
export const displayDate = (value) => value ? parseLocalDate(dateOnly(value)).toLocaleDateString('ru-RU') : '—'

export function useVacationApplication() {
  const route = useRoute()
  const userStore = useUserStore()
  const notifications = useNotificationStore()
  const vacation = ref(null)
  const loading = ref(true)
  const busy = ref(false)
  const loadError = ref('')
  const relatedLoading = ref(false)
  const employees = ref([])
  const types = ref([])
  const history = ref([])
  const historyError = ref(false)
  const comment = ref('')
  const editing = ref(false)
  const editError = ref('')
  const draft = reactive({ startDate: '', endDate: '', vacationTypeId: '', description: '' })
  const draftDays = ref(null)
  const draftFreeDays = ref(null)
  const isManager = computed(() => userStore.hasPermission('vacation.all', 'edit'))
  const isOwner = computed(() => String(vacation.value?.userId) === String(userStore.user?.id))
  const pending = computed(() => vacation.value?.status === 'pending')
  const canEdit = computed(() => pending.value && (isManager.value || (isOwner.value && userStore.hasPermission('vacation', 'edit'))))
  const employee = computed(() => employees.value.find((item) => String(item.user_id ?? item.id) === String(vacation.value?.userId)))
  const nameFor = (id) => {
    if (!id) return 'Автор не сохранён'
    const employee = employees.value.find((item) => String(item.user_id ?? item.id) === String(id))
    if (employee?.full_name) return employee.full_name
    const user = userStore.usersAll.find((item) => String(item.id) === String(id))
    return user ? [user.surname, user.name, user.patronymic].filter(Boolean).join(' ') : 'Сотрудник'
  }
  const status = computed(() => getVacationStatusMeta(vacation.value?.status))
  let loadSeq = 0
  async function load() {
    const seq = ++loadSeq
    loading.value = !vacation.value || vacation.value.id !== route.params.id
    loadError.value = ''
    relatedLoading.value = true
    try {
      const current = await getVacationById(route.params.id)
      if (seq !== loadSeq) return
      vacation.value = current
      const results = await Promise.allSettled([
        getInternalEmployees(), getActiveVacationTypes(), getVacationHistory(current.id),
      ])
      if (seq !== loadSeq) return
      employees.value = results[0].status === 'fulfilled' ? (results[0].value ?? []).flatMap((item) => Array.isArray(item.employees) ? item.employees.map((e) => ({ ...e, department: e.department || item.department })) : [item]) : []
      types.value = results[1].status === 'fulfilled' ? results[1].value ?? [] : []
      history.value = results[2].status === 'fulfilled' ? results[2].value ?? [] : []
      historyError.value = results[2].status === 'rejected'

    } catch (error) {
      if (seq !== loadSeq) return
      vacation.value = null
      loadError.value = error.response?.data?.error || 'Не удалось загрузить заявку'
    } finally {
      if (seq === loadSeq) { loading.value = false; relatedLoading.value = false }
    }
  }
  async function mutate(action) {
    if (busy.value) return false
    busy.value = true
    try {
      await action()
      comment.value = ''
      editing.value = false
      await load()
      return true
    } catch (error) {
      notifications.addNotification(error.response?.data?.error || error.message || 'Не удалось сохранить изменения', 'error')
      return false
    } finally { busy.value = false }
  }
  function decide(nextStatus) {
    return mutate(() => updateVacationStatus(vacation.value.id, nextStatus, comment.value.trim()))
  }
  function startEdit() {
    Object.assign(draft, { startDate: dateOnly(vacation.value.startDate), endDate: dateOnly(vacation.value.endDate), vacationTypeId: vacation.value.vacationTypeId?.String ?? '', description: vacation.value.description ?? '' })
    editError.value = ''
    editing.value = true
  }
  let balanceSeq = 0
  watch(() => [editing.value, draft.startDate, vacation.value?.userId], async ([enabled, start, userId]) => {
    const seq = ++balanceSeq
    draftFreeDays.value = null
    if (!enabled || !start || !userId) return
    try {
      const stats = await getVacationStats(Number(start.slice(0, 4)), userId)
      if (seq === balanceSeq) draftFreeDays.value = stats.free
    } catch { /* При сохранении баланс проверит сервер. */ }
  })
  let calcSeq = 0
  watch(() => [draft.startDate, draft.endDate], async ([start, end]) => {
    const seq = ++calcSeq
    draftDays.value = null
    if (!start || !end || start > end) return
    try { const result = await calculateVacationDays(start, end); if (seq === calcSeq) draftDays.value = result.totalVacationDays } catch { /* Сервер повторно проверит период при сохранении. */ }
  })
  function saveEdit() {
    if (!draft.startDate || !draft.endDate || draft.startDate > draft.endDate || !draft.vacationTypeId) { editError.value = 'Укажите корректный период и тип отпуска'; return }
    return mutate(() => editVacationApplication(vacation.value.id, { ...draft, startDate: new Date(`${draft.startDate}T00:00:00Z`), endDate: new Date(`${draft.endDate}T00:00:00Z`) }))
  }
  const changeType = (id) => mutate(() => updateVacationType(vacation.value.id, id))
  const withdraw = () => mutate(() => withdrawVacation(vacation.value.id))
  watch(() => route.params.id, () => { if (route.name === 'vacation-application') { vacation.value = null; editing.value = false; comment.value = ''; load() } }, { immediate: true })
  return { vacation, loading, busy, loadError, relatedLoading, types, history, historyError, employee, nameFor, status, isManager, isOwner, pending, canEdit, comment, editing, draft, draftDays, draftFreeDays, editError, load, decide, startEdit, saveEdit, changeType, withdraw }
}
