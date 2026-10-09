import {
  clearDays,
  createUpdatesObjects,
} from '@/helpers/usertimeentry.helpers'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useCalendarStore } from './calendar'
import { useNotificationStore } from './notification'
import { useDayTypesStore } from './dayTypes'
import { useUniversalModalStore } from './modal'
import { useSelectingStore } from './selecting'

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
  const { selectedItems, selectionStart } = storeToRefs(selectingStore)

  // Computed свойство для определения возможности удаления
  const isDelete = computed(() => {
    if (selectedItems.value.size > 1) {
      // Для множественного выбора проверяем, есть ли хотя бы один день с userTimeId
      return Array.from(selectedItems.value).some(
        (day) => day.userTimeId && day.userTimeId !== ''
      )
    } else if (selectedItems.value.size === 1) {
      // Для одиночного выбора проверяем selectionStart
      return (
        selectionStart.value?.userTimeId &&
        selectionStart.value.userTimeId !== ''
      )
    } else {
      // Для прямого открытия дня проверяем daysData
      return daysData.value?.userTimeId && daysData.value.userTimeId !== ''
    }
  })

  const open = (day) => {
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
      daysData.value = {
        ...selectionStart.value,
        date: parseDate(selectionStart.value.date),
      }
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
    const editedDays = isMultiEdit
      ? Array.from(selectedItems.value)
      : [daysData.value]
    const isUpdate = editedDays.some((d) => d.userTimeId)

    const hasMixedLocations =
      isMultiEdit &&
      new Set(editedDays.map((d) => d.workLocation).filter(Boolean)).size > 1

    const workTypeId = dayTypesStore.getDayTypeIdByName('work')

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
        value:
          daysData.value.userTimeTypeId !== ''
            ? daysData.value.userTimeTypeId
            : null,
        options: dayTypesStore.getUserEditTypes().map((dayType) => {
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
      showDeleteButton: isDelete.value,
      submitButtonText: isMultiEdit
        ? 'Записать'
        : isUpdate
          ? 'Обновить запись'
          : 'Добавить запись',
      deleteButtonText: 'Удалить',
      submittingText: 'Сохранение...',
      deletingText: 'Удаление...',

      onValidate: (data) => {
        if (data.hours < 0 || data.hours > 24) {
          return 'Количество часов должно быть от 0 до 24'
        }
        return null
      },

      onSubmit: async (data) => {
        const selectedItems = selectingStore.selectedItems

        try {
          // Определяем дни для обработки
          const daysToProcess =
            selectedItems.size > 1
              ? Array.from(selectedItems)
              : [daysData.value]

          const updates = createUpdatesObjects(
            daysToProcess,
            {
              ...data,
              workLocation: resolveWorkLocation(data, workTypeId),
            },
            calendarStore.selectedUserId
          )

          await calendarStore.updateDay(updates.toUpdate, updates.toCreate)

          selectingStore.clearSelection()
        } catch (error) {
          console.error('Ошибка при сохранении:', error)
          throw error
        }
      },

      onDelete: async () => {
        const selectedItems = selectingStore.selectedItems

        try {
          const daysToProcess =
            selectedItems.size > 1
              ? Array.from(selectedItems)
              : [daysData.value]

          await clearDays(daysToProcess, calendarStore, dayTypesStore)

          selectingStore.clearSelection()
        } catch (error) {
          console.error('Ошибка при удалении:', error)
          notificationStore.addNotification(
            'Не удалось удалить запись. Попробуйте ещё раз',
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
    close,
  }
})
