import {
  clearDays,
  createUpdatesObjects,
} from '@/helpers/usertimeentry.helpers'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useCalendarStore } from './calendar'
import { useNotificationStore } from './notification'
import { useDayTypesStore } from './dayTypes'
import { useUniversalModalStore } from './modal'
import { useSelectingStore } from './selecting'
import { useDayEditorStore } from './dayEditor'

/**
 * Создать начальное состояние дня
 */
const createInitialDayData = () => {
  return {
    date: new Date(),
    hours: 0,
    isEditType: true,
    isWeekend: false,
    holidays: [],
    userTimeId: '',
    userTimeTypeId: '',
    calendarEventTypeId: '',
    workLocation: '',
  }
}

const KEEP_LOCATION = 'keep'

// undefined — оставить у каждого дня своё значение
const resolveWorkLocation = (data, workTypeId) => {
  if (data.userTimeTypeId !== workTypeId) return null
  return data.workLocation === KEEP_LOCATION ? undefined : data.workLocation
}

export const useAddReportModalStore = defineStore('add-report-modal', () => {
  const universalModal = useUniversalModalStore()
  const calendarStore = useCalendarStore()
  const selectingStore = useSelectingStore()
  const notificationStore = useNotificationStore()
  const dayTypesStore = useDayTypesStore()
  const daysData = ref(createInitialDayData())
  const title = ref('')
  const { selectedItems } = storeToRefs(selectingStore)

  const open = (day, legacy = false) => {
    if (!legacy && !day && selectedItems.value.size > 1) {
      void useDayEditorStore().openGroup(Array.from(selectedItems.value))
      return
    }
    dayTypesStore.getUserEditTypes()

    if (day) {
      daysData.value = { ...day, date: parseDate(day.date) }
      title.value =
        getDateNamed(daysData.value.date) +
        ' ' +
        daysData.value.date.getFullYear()
    } else if (selectedItems.value.size > 1) {
      const days = []
      selectedItems.value.forEach((d) => {
        days.push({ ...d, date: parseDate(d.date) })
      })
      daysData.value = days[0]
      title.value =
        'Выбранные числа: ' + days.map((d) => d.date.getDate()).join(', ')
    } else if (selectedItems.value.size == 1) {
      const selectedDay = Array.from(selectedItems.value)[0]
      daysData.value = { ...selectedDay, date: parseDate(selectedDay.date) }
      title.value =
        getDateNamed(daysData.value.date) +
        ' ' +
        daysData.value.date.getFullYear()
    } else {
      const now = new Date()
      now.setUTCHours(0, 0, 0, 0)
      now.setMonth(calendarStore.currentMonth - 1)
      now.setFullYear(calendarStore.currentYear)

      const day = calendarStore.data.find(
        (d) => now.toUTCString() == parseDate(d.date).toUTCString()
      )

      // Дня нет в загруженных данных — открываем пустой
      daysData.value = day
        ? { ...day, date: parseDate(day.date) }
        : { ...createInitialDayData(), date: now }
      title.value =
        getDateNamed(daysData.value.date) +
        ' ' +
        daysData.value.date.getFullYear()
    }
    const isMultiEdit = selectedItems.value.size > 1
    if (!isMultiEdit && !legacy) {
      void useDayEditorStore().open(daysData.value)
      return
    }
    const editedDays = isMultiEdit
      ? Array.from(selectedItems.value)
      : [daysData.value]
    const isUpdate = editedDays.some((d) => d.userTimeId)

    const hasMixedLocations =
      isMultiEdit &&
      new Set(editedDays.map((d) => d.workLocation).filter(Boolean)).size > 1

    const workTypeId = dayTypesStore.getDayTypeIdByName('work')
    const managerSave = editedDays.some((item) => calendarStore.managerOperation(item.userTimeId ? 'edit' : 'create'))
    const managerDelete = editedDays.some((item) => item.userTimeId && calendarStore.managerOperation(
      item.userTimeTypeId === dayTypesStore.getDayTypeIdByName('vacation') ? 'edit' : 'delete'))
    const owner = calendarStore.selectedUserId
    const period = `${calendarStore.currentYear}-${calendarStore.currentMonth}`
    const ensureContext = () => {
      if (calendarStore.isLoading || owner !== calendarStore.selectedUserId
        || period !== `${calendarStore.currentYear}-${calendarStore.currentMonth}`) throw new Error('Календарь изменился. Откройте форму заново.')
    }
    const commentError = (value) => !value?.trim() || [...value.trim()].length > 4000
      ? 'Укажите причину изменения: от 1 до 4000 символов.' : null
    if (managerSave) {
      const error = editedDays.map(calendarStore.managerDayError).find(Boolean)
      if (error) { notificationStore.addNotification(error, 'warning'); return }
      if (editedDays.some((item) => item.userTimeId) && editedDays.some((item) => !item.userTimeId)) {
        notificationStore.addNotification('Выберите отдельно новые дни или существующие записи.', 'warning'); return
      }
    }
    const canDelete = editedDays.some((item) => item.userTimeId) && (!managerDelete || editedDays.every((item) => !calendarStore.managerDayError(item)))

    const fields = [
      {
        name: 'title',
        type: 'info',
        message: title.value,
      },
      {
        name: 'userTimeTypeId',
        type: 'select',
        label: 'Тип дня',
        value: managerSave ? workTypeId :
          daysData.value.userTimeTypeId !== ''
            ? daysData.value.userTimeTypeId
            : null,
        options: (managerSave ? [dayTypesStore.getDayTypeById(workTypeId)].filter(Boolean) : dayTypesStore.getUserEditTypes()).map((dayType) => {
          return {
            value: dayType.id,
            label: dayType.name,
          }
        }),
        required: true,
      },
      {
        name: 'hours',
        type: 'number',
        label: 'Количество часов',
        value: daysData.value.hours,
        min: 0,
        max: 24,
        step: 0.5,
      },
      {
        name: 'workLocation',
        type: 'radio',
        label: 'Место работы',
        value: hasMixedLocations
          ? KEEP_LOCATION
          : daysData.value.workLocation || 'office',
        visibleIf: (form) => form.userTimeTypeId === workTypeId,
        options: [
          ...(hasMixedLocations
            ? [{ value: KEEP_LOCATION, label: 'Не менять' }]
            : []),
          { value: 'office', label: 'Офис' },
          { value: 'remote', label: 'Удалённо' },
        ],
      },
    ]

    if (managerSave || (managerDelete && canDelete)) fields.push({
      name: 'comment', type: 'textarea', label: 'Причина изменения руководителем',
      value: '', required: managerSave, validators: managerSave ? [commentError] : [], rows: 3,
    })

    fields.push({
      name: 'date',
      type: 'hidden',
      value: daysData.value.date,
    })

    universalModal.open({
      width: '24rem',
      title: isMultiEdit
        ? 'Множественная запись'
        : isUpdate
          ? 'Редактировать запись'
          : 'Добавить запись',
      fields: fields,
      showDeleteButton: canDelete,
      submitButtonText: isMultiEdit
        ? 'Записать'
        : isUpdate
          ? 'Обновить запись'
          : 'Добавить запись',
      deleteButtonText: 'Удалить',
      submittingText: 'Сохранение...',
      deletingText: 'Удаление...',

      onValidate: (data) => {
        if (managerSave && commentError(data.comment)) return commentError(data.comment)
        if (data.hours < 0 || data.hours > 24) {
          return 'Количество часов должно быть от 0 до 24'
        }
        return null
      },

      onSubmit: async (data) => {
        try {
          // Определяем дни для обработки
          ensureContext()
          const daysToProcess = editedDays

          const updates = createUpdatesObjects(
            daysToProcess,
            {
              ...data,
              workLocation: resolveWorkLocation(data, workTypeId),
            },
            calendarStore.selectedUserId
          )

          await calendarStore.updateDay(updates.toUpdate, updates.toCreate, data.comment)

          selectingStore.clearSelection()
        } catch (error) {
          console.error('Ошибка при сохранении:', error)
          universalModal.formError = error.message || 'Не удалось сохранить запись'
          throw error
        }
      },

      onDelete: async (data) => {
        try {
          ensureContext()
          const daysToProcess = editedDays
          if (managerDelete) {
            const error = commentError(data.comment) || daysToProcess.map(calendarStore.managerDayError).find(Boolean)
            if (error) throw new Error(error)
            await calendarStore.deleteDay({ userId: owner,
              entryDate: daysToProcess.filter((item) => item.userTimeId).map((item) => parseDate(item.date)),
            }, data.comment)
          } else {
            await clearDays(daysToProcess, calendarStore, dayTypesStore)
          }

          selectingStore.clearSelection()
        } catch (error) {
          console.error('Ошибка при удалении:', error)
          universalModal.formError = error.message || 'Не удалось удалить запись'
          notificationStore.addNotification(
            error.message || 'Не удалось удалить запись. Попробуйте ещё раз',
            'error'
          )
          throw error
        }
      },
      //   onClose: () => {
      //     selectingStore.clearSelection()
      //   },
    })
  }

  const close = () => {
    universalModal.close()
  }

  return {
    open,
    openLegacy: (day) => open(day, true),
    close,
  }
})
