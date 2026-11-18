import { computed, reactive, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { createUpdatesObjects } from '@/helpers/usertimeentry.helpers'
import { historyDayKey } from '@/utils/timeEntryHistory.utils'
import { useCalendarStore } from './calendar'
import { useDayTypesStore } from './dayTypes'
import { useSelectingStore } from './selecting'
import { useNotificationStore } from './notification'
import { getCalendarDays } from '@/services/calendar.api'

export const useDayEditorStore = defineStore('day-editor', () => {
  const calendar = useCalendarStore()
  const types = useDayTypesStore()
  const active = ref(null)
  const anchorElement = shallowRef(null)
  const setAnchorElement = (element) => { anchorElement.value = element }
  const draft = reactive({ hours: 0, userTimeTypeId: '', workLocation: 'office', comment: '' })
  const saving = ref(false)
  const error = ref('')
  const saved = ref(false)
  const deleting = ref(false)
  const uncertain = ref(false)
  const baseline = ref('')
  let timer, inFlight = null, opening = 0

  const workId = computed(() => types.getDayTypeIdByName('work'))
  const managerSave = computed(() => !!active.value && calendar.managerOperation(active.value.day.userTimeId ? 'edit' : 'create'))
  const managerDelete = computed(() => !!active.value && calendar.managerOperation('delete'))
  const needsReason = computed(() => deleting.value ? managerDelete.value : managerSave.value)
  const values = () => ({
    hours: Number(draft.hours),
    userTimeTypeId: active.value?.day.isEditType === false ? active.value.day.userTimeTypeId : draft.userTimeTypeId,
    workLocation: draft.userTimeTypeId === workId.value ? draft.workLocation : null,
  })
  const key = (value) => JSON.stringify(value)
  const dirty = computed(() => !!active.value && (deleting.value ? !!active.value.day.userTimeId : key(values()) !== baseline.value))
  const contextMatches = () => active.value && active.value.owner === calendar.selectedUserId
    && active.value.year === calendar.currentYear && active.value.month === calendar.currentMonth
  const validation = computed(() => {
    if (!active.value) return ''
    if (!contextMatches()) return 'Вернитесь к исходному сотруднику и месяцу, чтобы сохранить изменения.'
    if (needsReason.value && (!draft.comment.trim() || [...draft.comment.trim()].length > 4000)) return 'Укажите причину изменения: от 1 до 4000 символов.'
    if (!deleting.value && (draft.hours === '' || !Number.isFinite(Number(draft.hours)) || Number(draft.hours) < 0 || Number(draft.hours) > 24)) return 'Количество часов должно быть от 0 до 24.'
    if (!deleting.value && !values().userTimeTypeId) return 'Выберите тип дня.'
    if (!deleting.value && values().userTimeTypeId === workId.value && !['office', 'remote'].includes(draft.workLocation)) return 'Выберите место работы.'
    return ''
  })
  const editableTypes = computed(() => managerSave.value
    ? [types.getDayTypeById(workId.value)].filter(Boolean) : types.getUserEditTypes())
  const vacation = computed(() => active.value?.day.userTimeTypeId === types.getDayTypeIdByName('vacation'))

  const change = (field, value) => {
    draft[field] = value
    saved.value = false
    clearTimeout(timer)
    if (!error.value) timer = setTimeout(() => { void flush() }, 500)
  }

  // Read before retry: a failed response does not prove the write was rolled back.
  const reconcile = async () => {
    if (!contextMatches()) throw new Error('Календарь изменился. Вернитесь к исходному месяцу.')
    const session = active.value
    const result = await getCalendarDays(session.month, session.year, session.owner)
    const day = result?.days?.find((item) => historyDayKey(item.date) === historyDayKey(session.day.date))
    if (!day) throw new Error('Не удалось проверить запись на сервере. Повторите попытку.')
    session.day = { ...day }
    baseline.value = key({ hours: Number(day.hours), userTimeTypeId: day.userTimeTypeId,
      workLocation: day.userTimeTypeId === workId.value ? day.workLocation || null : null })
    await calendar.initialFetch()
    if (!calendar.data.some((item) => historyDayKey(item.date) === historyDayKey(day.date))) throw new Error('Не удалось обновить календарь. Повторите попытку.')
    uncertain.value = false
  }

  const run = async () => {
    const retrying = !!error.value
    saving.value = true
    error.value = ''
    try {
      if (uncertain.value || retrying) await reconcile()
      while (dirty.value) {
        if (validation.value) return false
        if (calendar.isLoading || calendar.mutationPending) throw new Error('Дождитесь загрузки календаря и повторите попытку.')
        const session = active.value
        const removing = deleting.value
        const config = values()
        const sent = key(config)
        const reason = draft.comment.trim()
        const managed = removing ? managerDelete.value : managerSave.value
        if (managed) {
          const restriction = calendar.managerDayError(session.day)
          if (restriction) throw new Error(restriction)
          if (!removing && config.userTimeTypeId !== workId.value) throw new Error('Руководитель может изменять только рабочие записи.')
        }
        uncertain.value = true
        if (removing) {
          await calendar.deleteDay({ userId: session.owner, entryDate: [new Date(session.day.date)] }, reason)
        } else {
          const updates = createUpdatesObjects([session.day], config, session.owner)
          await calendar.updateDay(updates.toUpdate, updates.toCreate, reason)
        }
        const day = calendar.data.find((item) => historyDayKey(item.date) === historyDayKey(session.day.date))
        if (!day) throw new Error('Изменение отправлено, но календарь не обновлён. Повторите проверку.')
        const actual = key({ hours: Number(day.hours), userTimeTypeId: day.userTimeTypeId,
          workLocation: day.userTimeTypeId === workId.value ? day.workLocation || null : null })
        if (removing ? !!day.userTimeId : !day.userTimeId || actual !== sent) {
          throw new Error('Результат сохранения не подтверждён. Повторите проверку.')
        }
        session.day = { ...day }
        baseline.value = removing ? key(values()) : sent
        uncertain.value = false
      }
      saved.value = true
      return true
    } catch (failure) {
      error.value = failure.message || 'Не удалось сохранить изменения.'
      saved.value = false
      return false
    } finally {
      saving.value = false
    }
  }
  const flush = () => {
    clearTimeout(timer)
    if (inFlight) return inFlight
    if (!active.value || (!dirty.value && !uncertain.value)) return Promise.resolve(true)
    inFlight = run().finally(() => { inFlight = null })
    return inFlight
  }
  const close = async () => {
    if (!active.value) return true
    if (!await flush() || dirty.value || uncertain.value) return false
    anchorElement.value = null
    active.value = null
    useSelectingStore().clearSelection()
    return true
  }
  const open = async (day, element) => {
    const request = ++opening
    const owner = calendar.selectedUserId, year = calendar.currentYear, month = calendar.currentMonth
    if (active.value && active.value.owner === calendar.selectedUserId
      && historyDayKey(active.value.day.date) === historyDayKey(day.date)) return
    if (!await close() || request !== opening) return
    if (calendar.isLoading || calendar.mutationPending || owner !== calendar.selectedUserId
      || year !== calendar.currentYear || month !== calendar.currentMonth) return
    day = calendar.data.find((item) => historyDayKey(item.date) === historyDayKey(day.date))
    if (!day) return
    if (calendar.managerOperation(day.userTimeId ? 'edit' : 'create')) {
      const restriction = calendar.managerDayError(day)
      if (restriction) { useNotificationStore().addNotification(restriction, 'warning'); return }
    }
    anchorElement.value = element?.isConnected ? element : null
    const rect = element?.getBoundingClientRect()
    active.value = { owner: calendar.selectedUserId, year: calendar.currentYear, month: calendar.currentMonth,
      day: { ...day }, anchor: rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom } : null }
    Object.assign(draft, { hours: Number(day.hours) || 0, userTimeTypeId: day.userTimeTypeId || workId.value || '',
      workLocation: day.workLocation || 'office', comment: '' })
    baseline.value = key(values())
    deleting.value = false
    uncertain.value = false
    error.value = ''
    saved.value = false
    const selecting = useSelectingStore()
    if (selecting.selectedCount <= 1) selecting.clearSelection()
  }
  const remove = () => {
    if (!active.value?.day.userTimeId || saving.value) return
    if (vacation.value && !managerDelete.value) {
      change('hours', 0)
    } else {
      deleting.value = true
      saved.value = false
      void flush()
    }
  }
  return { active, anchorElement, setAnchorElement, draft, saving, error, saved, dirty, deleting, uncertain, validation,
    editableTypes, workId, managerSave, needsReason, vacation, change, flush, close, open, remove }
})
