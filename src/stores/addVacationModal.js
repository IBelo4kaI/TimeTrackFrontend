import { createVacation } from '@/services/vacation.api'
import { existsFreeVacation, startDateBeforeEnd } from '@/utils/modal.utils'
import { defineStore } from 'pinia'
import { useUniversalModalStore } from './modal'
import { useNotificationStore } from './notification'
import { useUserStore } from './user'
import { useVacationStore } from './vacation'

export const useAddVacationModalStore = defineStore(
  'add-vacation-modal',
  () => {
    const universalModal = useUniversalModalStore()
    const vacationStore = useVacationStore()
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
            label: 'Пользователь',
            value: userId,
            options: [
              ...userStore.usersAll.map((u) => {
                return {
                  value: u.id,
                  label: u.name,
                }
              }),
            ],
          },
          {
            name: 'status',
            type: 'select',
            label: 'Статус',
            value: 'pending',
            options: [
              { value: 'rejected', label: 'Отклонено' },
              { value: 'pending', label: 'На рассмотрении' },
              { value: 'approved', label: 'Утверждено' },
            ],
          }
        )
      } else {
        fields.push(
          {
            name: 'userId',
            type: 'hidden',
            value: userId,
          },
          {
            name: 'status',
            type: 'hidden',
            value: 'pending',
          }
        )
      }

      fields.push(
        {
          name: 'startDate',
          type: 'date',
          label: 'Дата начала',
          required: true,
          validators: [
            startDateBeforeEnd('startDate', 'endDate'),
            !isAdmin ? existsFreeVacation(vacationStore) : (_) => null,
          ],
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Дата окончания',
          required: true,
          validators: [
            startDateBeforeEnd('startDate', 'endDate'),
            !isAdmin ? existsFreeVacation(vacationStore) : (_) => null,
          ],
        },
        {
          name: 'description',
          type: 'text',
          label: 'Описание',
        }
      )

      universalModal.open({
        title: 'Создание заявки на отпуск',
        fields: fields,
        submitButtonText: 'Добавить отпуск',
        submittingText: 'Сохранение...',

        onSubmit: async (data) => {
          console.log(data)

          try {
            await createVacation({
              ...data,
              startDate: new Date(data.startDate),
              endDate: new Date(data.endDate),
            })

            await vacationStore.fetchUserVacations()

            notificationStore.addNotification(
              'Заявка на отпуск создана!',
              'success'
            )
          } catch (error) {
            console.error('Ошибка при сохранении:', error)
            throw error
          }
        },
      })
    }

    const close = () => {
      universalModal.close()
    }

    return {
      open,
      close,
    }
  }
)
