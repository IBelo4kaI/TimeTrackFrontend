import { createUpdatesObjects } from '@/helpers/usertimeentry.helpers'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate, parseDateStartDay } from '@/utils/date.utils'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useCalendarStore } from './calendar'
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
  }
}

export const useAddReportModalStore = defineStore('add-report-modal', () => {
  const universalModal = useUniversalModalStore()
  const calendarStore = useCalendarStore()
  const selectingStore = useSelectingStore()
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
      title.value = 'Выбранные числа: '
      const days = []
      selectedItems.value.forEach((d) => {
        day = { ...d, date: parseDate(d.date) }
        title.value += day.date.getDate() + ', '
        days.push(day)
      })
      daysData.value = days[0]
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

      const day = calendarStore.data.find((d) => {
        console.log(now, parseDate(d.date))
        if (now.toUTCString() == parseDate(d.date).toUTCString()) return true
      })

      daysData.value = { ...day, date: parseDate(day.date) }
      title.value =
        getDateNamed(daysData.value.date) +
        ' ' +
        daysData.value.date.getFullYear()
    }
    const isMultiEdit = daysData.value.length > 1
    const isUpdate = daysData.value.userTimeId !== ''

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
    ]

    fields.push({
      name: 'date',
      type: 'hidden',
      value: daysData.value.date,
    })

    universalModal.open({
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
        console.log(data.userTimeTypeId !== '')

        return data.userTimeTypeId !== '' && data.hours >= 0 && data.hours <= 24
          ? null
          : 'Ошибка валидации'
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
            data,
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
          // Определяем дни для обработки
          const daysToProcess =
            selectedItems.size > 1
              ? Array.from(selectedItems)
              : [daysData.value]

          const userTimeIds = daysToProcess
            .filter((day) => day.userTimeId && day.userTimeId !== '')
            .map((day) => parseDateStartDay(day.date))

          if (userTimeIds.length > 0) {
            await calendarStore.deleteDay({
              userId: calendarStore.selectedUserId,
              entryDate: userTimeIds,
            })
          }

          selectingStore.clearSelection()
        } catch (error) {
          console.error('Ошибка при удалении:', error)
          alert('Не удалось удалить запись. Попробуйте еще раз.')
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
