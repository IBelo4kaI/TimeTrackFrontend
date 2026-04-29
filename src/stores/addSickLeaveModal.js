import { createSickLeave } from '@/services/sick_leave.api'
import { startDateBeforeEnd } from '@/utils/modal.utils'
import { defineStore } from 'pinia'
import { useUniversalModalStore } from './modal'
import { useNotificationStore } from './notification'
import { useSickLeaveStore } from './sick_leave'
import { useUserStore } from './user'

export const useAddSickLeaveModalStore = defineStore('add-sick-leave-modal', () => {
  const universalModal = useUniversalModalStore()
  const sickLeaveStore = useSickLeaveStore()
  const notificationStore = useNotificationStore()
  const userStore = useUserStore()

  const open = (isAdmin = false) => {
    const userId = userStore.user.id
    const fields = []

    if (isAdmin) {
      fields.push(
        {
          name: 'userId',
          type: 'select',
          label: 'Сотрудник',
          value: userId,
          options: userStore.usersAll.map((u) => ({
            value: u.id,
            label: [u.name, u.surname].filter(Boolean).join(' '),
          })),
        },
        {
          name: 'status',
          type: 'select',
          label: 'Статус',
          value: 'unofficial',
          options: [
            { value: 'unofficial', label: 'Неофициальный' },
            { value: 'official', label: 'Официальный' },
          ],
        }
      )
    } else {
      fields.push(
        { name: 'userId', type: 'hidden', value: userId },
        { name: 'status', type: 'hidden', value: 'unofficial' }
      )
    }

    fields.push(
      {
        name: 'startDate',
        type: 'date',
        label: 'Дата начала',
        required: true,
        validators: [startDateBeforeEnd('startDate', 'endDate')],
      },
      {
        name: 'endDate',
        type: 'date',
        label: 'Дата окончания',
        required: true,
        validators: [startDateBeforeEnd('startDate', 'endDate')],
      },
      {
        name: 'description',
        type: 'text',
        label: 'Описание',
      }
    )

    universalModal.open({
      title: 'Добавить больничный',
      fields,
      submitButtonText: 'Добавить',
      submittingText: 'Сохранение...',
      onSubmit: async (data) => {
        await createSickLeave({
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        })
        await sickLeaveStore.fetchSickLeaves()
        notificationStore.addNotification('Больничный добавлен', 'success')
      },
    })
  }

  const close = () => universalModal.close()

  return { open, close }
})
