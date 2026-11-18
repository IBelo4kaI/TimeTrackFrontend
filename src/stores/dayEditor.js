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
  const baseline = ref(null)
  const editedFields = reactive(new Set())
  const mixed = reactive({ hours: false, userTimeTypeId: false, workLocation: false })
  const days = computed(() => active.value?.days || (active.value ? [active.value.day] : []))
  const isGroup = computed(() => days.value.length > 1)
  const selectedCount = computed(() => days.value.length)
  const hoursValue = (value) => value == null || value === '' ? NaN : Number(value)
  // MySQL stores hours as DECIMAL(5,2); calendar returns a JSON number.
  const storedHours = (value) => {
    const hours = hoursValue(value)
    return Math.round((hours + Number.EPSILON * Math.max(1, Math.abs(hours))) * 100) / 100
  }
  const record = (day) => ({ hours: hoursValue(day.hours), userTimeTypeId: day.userTimeTypeId || '', workLocation: day.workLocation || null })
  const mismatches = (day, value, fields) => {
    const actual = record(day)
    return fields.filter((field) => field === 'hours'
      ? !Number.isFinite(actual.hours) || storedHours(actual.hours) !== storedHours(value.hours)
      : actual[field] !== value[field])
  }
  const same = (day, value, fields) => mismatches(day, value, fields).length === 0
  const hasRecords = computed(() => days.value.some((day) => day.userTimeId))
  const isEditedDay = (date) => active.value?.owner === calendar.selectedUserId
    && days.value.some((day) => historyDayKey(day.date) === historyDayKey(date))
  let timer, inFlight = null, opening = 0
  let pendingGroup = []
  let debounceUntil = 0, forceFlush = false, wakeDebounce = null

  const workId = computed(() => types.getDayTypeIdByName('work'))
  const managerSave = computed(() => days.value.some((day) => calendar.managerOperation(day.userTimeId ? 'edit' : 'create')))
  const managerDelete = computed(() => isGroup.value
    ? days.value.some((day) => day.userTimeId && calendar.managerOperation(day.userTimeTypeId === types.getDayTypeIdByName('vacation') ? 'edit' : 'delete'))
    : !!active.value && calendar.managerOperation('delete'))
  const needsReason = computed(() => deleting.value ? managerDelete.value : managerSave.value)
  const values = () => ({
    hours: Number(draft.hours),
    userTimeTypeId: active.value?.day.isEditType === false ? active.value.day.userTimeTypeId : draft.userTimeTypeId,
    workLocation: draft.userTimeTypeId === workId.value ? draft.workLocation : null,
  })
  const validHoursInput = (value) => /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(value))
    && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 24
  const dirty = computed(() => !!active.value && (isGroup.value ? (deleting.value ? groupChanges().length > 0 : editedFields.size > 0)
    : deleting.value ? !!active.value.day.userTimeId : !validHoursInput(draft.hours) || !same(values(), baseline.value, ['hours', 'userTimeTypeId', 'workLocation'])))
  const contextMatches = () => active.value && active.value.owner === calendar.selectedUserId
    && active.value.year === calendar.currentYear && active.value.month === calendar.currentMonth
  const validation = computed(() => {
    if (!active.value) return ''
    if (!contextMatches()) return 'Вернитесь к исходному сотруднику и месяцу, чтобы сохранить изменения.'
    if (isGroup.value) return groupValidation()
    if (needsReason.value && (!draft.comment.trim() || [...draft.comment.trim()].length > 4000)) return 'Укажите причину изменения: от 1 до 4000 символов.'
    if (!deleting.value && !validHoursInput(draft.hours)) return 'Количество часов должно быть от 0 до 24.'
    if (!deleting.value && !values().userTimeTypeId) return 'Выберите тип дня.'
    if (!deleting.value && values().userTimeTypeId === workId.value && !['office', 'remote'].includes(draft.workLocation)) return 'Выберите место работы.'
    return ''
  })
  const editableTypes = computed(() => managerSave.value
    ? [types.getDayTypeById(workId.value)].filter(Boolean) : types.getUserEditTypes())
  const vacation = computed(() => active.value?.day.userTimeTypeId === types.getDayTypeIdByName('vacation'))
  const blockedGroupDays = () => days.value.filter((day) => {
    if (deleting.value && !day.userTimeId) return false
    const action = deleting.value && day.userTimeTypeId !== types.getDayTypeIdByName('vacation') ? 'delete' : day.userTimeId ? 'edit' : 'create'
    return calendar.managerOperation(action) && calendar.managerDayError(day)
  })
  const groupBlockedCount = computed(() => isGroup.value && !calendar.isLoading && !saving.value ? blockedGroupDays().length : 0)
  const fixedTypeCount = computed(() => isGroup.value ? days.value.filter((day) => day.isEditType === false).length : 0)
  const canApplyType = (id) => !deleting.value && (!managerSave.value || (isGroup.value && id === workId.value)) && !groupBlockedCount.value
    && editableTypes.value.some((type) => type.id === id)
    && days.value.every((day) => day.isEditType !== false || day.userTimeTypeId === id)
  const targetType = (day) => isGroup.value && editedFields.has('userTimeTypeId') ? draft.userTimeTypeId : day.userTimeTypeId
  const canChangeLocation = computed(() => !groupBlockedCount.value && (isGroup.value
    ? days.value.some((day) => targetType(day) === workId.value && day.isEditType !== false)
    : draft.userTimeTypeId === workId.value))
  const locationSkippedCount = computed(() => isGroup.value ? days.value.filter((day) => targetType(day) !== workId.value).length : 0)

  const syncGroupDraft = (preserveHours = false) => {
    for (const field of ['hours', 'userTimeTypeId', 'workLocation']) {
      if (editedFields.has(field)) continue
      const relevant = field === 'workLocation' ? days.value.filter((day) => day.userTimeTypeId === workId.value) : days.value
      const distinct = [...new Set(relevant.map((day) => record(day)[field]))]
      mixed[field] = distinct.length > 1
      const value = mixed[field] ? null : distinct[0] ?? null
      if (field !== 'hours' || !preserveHours || mixed[field] || Number(draft.hours) !== value) draft[field] = value
    }
  }
  const patch = () => Object.fromEntries([...editedFields].map((field) => [field, draft[field]]))
  const groupTarget = (day, changes) => {
    const value = record(day)
    if ('hours' in changes) value.hours = Number(changes.hours)
    if ('userTimeTypeId' in changes) {
      value.userTimeTypeId = changes.userTimeTypeId
      if (value.userTimeTypeId !== workId.value) value.workLocation = null
    }
    if ('workLocation' in changes && value.userTimeTypeId === workId.value && day.isEditType !== false) value.workLocation = changes.workLocation
    value.hours = storedHours(value.hours)
    value.workLocation = value.userTimeTypeId === workId.value ? value.workLocation || 'office' : null
    return value
  }
  const groupFields = (day, changes) => !day.userTimeId
    ? ['hours', 'userTimeTypeId', 'workLocation']
    : [...('hours' in changes ? ['hours'] : []),
      ...('userTimeTypeId' in changes ? ['userTimeTypeId', 'workLocation'] : 'workLocation' in changes && targetType(day) === workId.value && day.isEditType !== false ? ['workLocation'] : [])]
  const groupChanges = () => {
    const changes = patch()
    const plan = days.value.flatMap((day) => {
      if (deleting.value) {
        if (!day.userTimeId) return []
        if (day.userTimeTypeId !== types.getDayTypeIdByName('vacation')) return [{ day, operation: 'delete' }]
        const value = { ...record(day), hours: 0 }
        return same(day, value, ['hours']) ? [] : [{ day, value, fields: ['hours'], operation: 'update' }]
      }
      if (!editedFields.size || (!day.userTimeId && !('hours' in changes) && !('userTimeTypeId' in changes))) return []
      const value = groupTarget(day, changes)
      const fields = groupFields(day, changes)
      if (day.userTimeId && same(day, value, fields)) return []
      return [{ day, value, fields, operation: day.userTimeId ? 'update' : 'create' }]
    })
    // Keep sent expectations across an uncertain response, including create fields.
    for (const pending of pendingGroup) {
      const date = historyDayKey(pending.day.date)
      const day = days.value.find((item) => historyDayKey(item.date) === date)
      if (!day) continue
      const index = plan.findIndex((item) => historyDayKey(item.day.date) === date)
      const expected = Object.fromEntries((pending.fields || []).map((field) => [field, pending.value[field]]))
      const value = pending.operation === 'delete' ? undefined : groupTarget({ ...day, ...expected }, changes)
      const fields = [...new Set([...(pending.fields || []), ...groupFields(day, changes)])]
      const item = { day, value, fields, operation: pending.operation === 'delete' ? 'delete' : day.userTimeId ? 'update' : 'create' }
      if (index !== -1) plan.splice(index, 1)
      if (confirmationFailure(item, day).length) plan.push(item)
    }
    return plan
  }
  const invalidGroupHours = () => editedFields.has('hours') && !validHoursInput(draft.hours)
  const groupValidation = () => {
    const blocked = blockedGroupDays()
    if (blocked.length) return `Недоступны для редактирования ${blocked.length} из ${selectedCount.value} дат. ${calendar.managerDayError(blocked[0])}`
    if (needsReason.value && (!draft.comment.trim() || [...draft.comment.trim()].length > 4000)) return 'Укажите причину изменения: от 1 до 4000 символов.'
    if (!deleting.value && invalidGroupHours()) return 'Количество часов должно быть от 0 до 24.'
    if (!deleting.value && editedFields.has('userTimeTypeId') && !canApplyType(draft.userTimeTypeId)) return 'Выбранный тип нельзя применить ко всем датам.'
    if (!deleting.value && editedFields.has('workLocation') && !['office', 'remote'].includes(draft.workLocation)) return 'Выберите место работы.'
    const empty = groupChanges().filter((item) => item.operation === 'create' && !item.value.userTimeTypeId).length
    if (empty) return `Для создания записей в ${empty} пустых датах выберите общий тип дня.`
    return ''
  }
  const syncGroupDays = (rows) => {
    if (!Array.isArray(rows)) throw new Error('Не удалось проверить выбранные дни.')
    const byDate = new Map(rows.map((day) => [historyDayKey(day.date), day]))
    const refreshed = days.value.map((day) => byDate.get(historyDayKey(day.date)))
    if (refreshed.some((day) => !day)) throw new Error('Не все выбранные дни доступны. Обновите исходный месяц.')
    const anchorDate = historyDayKey(active.value.day.date)
    active.value.days = refreshed.map((day) => ({ ...day }))
    active.value.day = active.value.days.find((day) => historyDayKey(day.date) === anchorDate)
    useSelectingStore().selectedItems = new Set(active.value.days)
    syncGroupDraft()
  }
  const confirmationFailure = (item, day) => {
    if (!day) return ['missing_day']
    if (item.operation === 'delete') return day.userTimeId ? ['entry_still_exists'] : []
    if (!day.userTimeId) return ['missing_entry']
    return mismatches(day, item.value, item.fields).map((field) => `mismatch:${field}`)
  }
  const diagnoseGroup = (item, day, failed) => {
    if (!import.meta.env.DEV) return
    const snapshot = (value) => value && Object.fromEntries(item.fields?.map((field) => [field,
      field === 'userTimeTypeId' ? types.getDayTypeById(value[field])?.systemName || (value[field] ? 'unknown_type' : null) : value[field]]) || [])
    console.warn('DayEditor: group confirmation failed', {
      date: historyDayKey(item.day.date), operation: item.operation, failed,
      expected: item.operation === 'delete' ? { exists: false } : snapshot(item.value),
      actual: day ? { exists: !!day.userTimeId, ...snapshot(record(day)) } : null,
    })
  }
  const runGroup = async (retrying) => {
    if (uncertain.value || retrying) await reconcile()
    while (dirty.value) {
      await waitForInput()
      if (!deleting.value && invalidGroupHours()) return false
      const plan = groupChanges()
      if (!plan.length) {
        const preserveHours = editedFields.has('hours')
        pendingGroup = []
        editedFields.clear()
        syncGroupDraft(preserveHours)
        break
      }
      if (calendar.isLoading || calendar.mutationPending) throw new Error('Дождитесь загрузки календаря и повторите попытку.')
      if (validation.value) return false
      const operation = ['delete', 'update', 'create'].find((kind) => plan.some((item) => item.operation === kind))
      const batch = plan.filter((item) => item.operation === operation)
      uncertain.value = true
      if (operation === 'delete') {
        pendingGroup = batch
        await calendar.deleteDay({ userId: active.value.owner, entryDate: batch.map((item) => new Date(item.day.date)) }, draft.comment.trim())
      } else {
        const updates = { userId: active.value.owner, entities: [] }, creates = { userId: active.value.owner, entities: [] }
        for (const item of batch) {
          const result = createUpdatesObjects([item.day], item.value, active.value.owner)
          const entity = result.toUpdate.entities[0] || result.toCreate.entities[0]
          item.value = {
            hours: storedHours(entity.hoursWorked), userTimeTypeId: entity.dayTypeId,
            workLocation: entity.dayTypeId === workId.value ? entity.workLocation || 'office' : null,
          }
          item.fields = [...new Set([...item.fields, 'workLocation'])]
          updates.entities.push(...result.toUpdate.entities)
          creates.entities.push(...result.toCreate.entities)
        }
        pendingGroup = batch
        await calendar.updateDay(updates, creates, draft.comment.trim())
      }
      if (!contextMatches()) throw new Error('Календарь изменился. Вернитесь к исходному месяцу.')
      const actual = new Map(calendar.data.map((day) => [historyDayKey(day.date), day]))
      for (const item of batch) {
        const day = actual.get(historyDayKey(item.day.date))
        const failed = confirmationFailure(item, day)
        if (failed.length) {
          diagnoseGroup(item, day, failed)
          throw new Error('Не удалось подтвердить изменения. Повторите проверку.')
        }
      }
      syncGroupDays(calendar.data)
      pendingGroup = []
      uncertain.value = false
    }
    return true
  }
  const discardGroupChanges = () => {
    if (!isGroup.value || saving.value) return
    clearTimeout(timer)
    editedFields.clear()
    pendingGroup = []
    deleting.value = false
    saved.value = false
    syncGroupDraft()
  }


  const releaseDebounce = () => {
    clearTimeout(timer)
    wakeDebounce?.()
  }
  const waitForInput = async () => {
    while (!forceFlush && Date.now() < debounceUntil) {
      await new Promise((resolve) => {
        wakeDebounce = resolve
        timer = setTimeout(resolve, debounceUntil - Date.now())
      })
      clearTimeout(timer)
      wakeDebounce = null
    }
  }
  const change = (field, value) => {
    draft[field] = value
    if (field !== 'comment') {
      editedFields.add(field)
      if (isGroup.value) mixed[field] = false
    }
    saved.value = false
    // A short-delay field must not shorten a pending hours debounce.
    debounceUntil = Math.max(debounceUntil, Date.now() + (field === 'hours' ? 1000 : 400))
    releaseDebounce()
    if (!error.value && !inFlight) timer = setTimeout(() => { void startSave(false) }, Math.max(0, debounceUntil - Date.now()))
  }
  const syncSingleDraft = (day) => {
    const value = record(day)
    value.workLocation = value.userTimeTypeId === workId.value ? value.workLocation : null
    for (const field of ['hours', 'userTimeTypeId', 'workLocation']) {
      if (!editedFields.has(field)) draft[field] = field === 'workLocation' ? value[field] || 'office' : value[field]
    }
    baseline.value = value
  }

  // Read before retry: a failed response does not prove the write was rolled back.
  const reconcile = async () => {
    if (!contextMatches()) throw new Error('Календарь изменился. Вернитесь к исходному месяцу.')
    const session = active.value
    const result = await getCalendarDays(session.month, session.year, session.owner)
    if (isGroup.value) {
      syncGroupDays(result?.days)
      await calendar.initialFetch()
      syncGroupDays(calendar.data)
      uncertain.value = false
      return
    }
    const day = result?.days?.find((item) => historyDayKey(item.date) === historyDayKey(session.day.date))
    if (!day) throw new Error('Не удалось проверить запись на сервере. Повторите попытку.')
    session.day = { ...day }
    syncSingleDraft(day)
    await calendar.initialFetch()
    if (!calendar.data.some((item) => historyDayKey(item.date) === historyDayKey(day.date))) throw new Error('Не удалось обновить календарь. Повторите попытку.')
    uncertain.value = false
  }

  const run = async () => {
    const retrying = !!error.value
    saving.value = true
    error.value = ''
    try {
      if (isGroup.value) {
        const complete = await runGroup(retrying)
        saved.value = complete
        return complete
      }
      if (uncertain.value || retrying) await reconcile()
      while (dirty.value) {
        await waitForInput()
        if (!dirty.value) break
        if (validation.value) return false
        if (calendar.isLoading || calendar.mutationPending) throw new Error('Дождитесь загрузки календаря и повторите попытку.')
        const session = active.value
        const removing = deleting.value
        const config = values()
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
        if (removing ? !!day.userTimeId : !day.userTimeId || !same(day, config, ['hours', 'userTimeTypeId', 'workLocation'])) {
          throw new Error('Результат сохранения не подтверждён. Повторите проверку.')
        }
        session.day = { ...day }
        if (removing) baseline.value = values()
        else syncSingleDraft(day)
        uncertain.value = false
      }
      editedFields.clear()
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
  const startSave = (force) => {
    if (force) {
      forceFlush = true
      debounceUntil = 0
      releaseDebounce()
    }
    if (inFlight) return inFlight
    clearTimeout(timer)
    if (!active.value || (!dirty.value && !uncertain.value)) {
      forceFlush = false
      return Promise.resolve(true)
    }
    inFlight = run().finally(() => {
      inFlight = null
      forceFlush = false
    })
    return inFlight
  }
  const flush = () => startSave(true)
  const close = async () => {
    if (!active.value) return true
    if (!await flush() || dirty.value || uncertain.value) return false
    const selecting = useSelectingStore()
    const group = isGroup.value
    if (group) selecting.selectedItems = new Set(days.value)
    selecting.isGroupEditing = false
    anchorElement.value = null
    active.value = null
    debounceUntil = 0
    pendingGroup = []
    editedFields.clear()
    if (!group) selecting.clearSelection()
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
    baseline.value = values()
    editedFields.clear()
    Object.assign(mixed, { hours: false, userTimeTypeId: false, workLocation: false })
    deleting.value = false
    uncertain.value = false
    error.value = ''
    saved.value = false
    const selecting = useSelectingStore()
    if (selecting.selectedCount <= 1) selecting.clearSelection()
  }
  const openGroup = async (selection, element) => {
    if (!selection?.length) return
    const requested = [...new Set(selection.map((day) => historyDayKey(day.date)))].sort()
    if (requested.length < 2) return open(selection[0], element)
    const request = ++opening
    const owner = calendar.selectedUserId, year = calendar.currentYear, month = calendar.currentMonth
    const lastSelected = historyDayKey(useSelectingStore().lastSelected?.date)
    const anchorDate = requested.includes(lastSelected) ? lastSelected : historyDayKey(selection.at(-1).date)
    if (!await close() || request !== opening) return
    if (calendar.isLoading || calendar.mutationPending || owner !== calendar.selectedUserId || year !== calendar.currentYear || month !== calendar.currentMonth) return
    const available = new Map(calendar.data.map((day) => [historyDayKey(day.date), day]))
    const missing = requested.filter((date) => !available.has(date)).length
    if (missing) { useNotificationStore().addNotification(`Недоступны ${missing} выбранных дат. Обновите календарь.`, 'warning'); return }
    const selected = requested.map((date) => ({ ...available.get(date) }))
    const day = selected.find((item) => historyDayKey(item.date) === anchorDate) || selected[0]
    active.value = { owner, year, month, day, days: selected, anchor: null }
    anchorElement.value = element?.isConnected ? element : null
    editedFields.clear()
    pendingGroup = []
    deleting.value = false
    uncertain.value = false
    error.value = ''
    saved.value = false
    draft.comment = ''
    syncGroupDraft()
    const selecting = useSelectingStore()
    selecting.isGroupEditing = true
    selecting.selectedItems = new Set(selected)
  }
  const remove = () => {
    if (!hasRecords.value || saving.value) return
    if (isGroup.value) {
      editedFields.clear()
      deleting.value = true
      saved.value = false
      void flush()
      return
    }
    if (vacation.value && !managerDelete.value) {
      change('hours', 0)
    } else {
      deleting.value = true
      saved.value = false
      void flush()
    }
  }
  return { active, isGroup, selectedCount, mixed, hasRecords, isEditedDay, canApplyType, canChangeLocation, groupBlockedCount, fixedTypeCount, locationSkippedCount, discardGroupChanges, openGroup, anchorElement, setAnchorElement, draft, saving, error, saved, dirty, deleting, uncertain, validation,
    editableTypes, workId, managerSave, needsReason, vacation, change, flush, close, open, remove }
})
