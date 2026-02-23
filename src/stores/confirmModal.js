import { defineStore } from 'pinia'
import { useNotificationStore } from './notification'
import { useUniversalModalStore } from './modal'

export const useConfirmModal = defineStore('confirm-modal', () => {
  const universalModal = useUniversalModalStore()
  const notificationStore = useNotificationStore()

  const open = (onSubmit, title) => {
    const fields = []

    fields.push()

    universalModal.open({
      title: title,
      fields: fields,
      submitButtonText: 'Да',
      submittingText: 'Выполнение...',

      onSubmit: async (data) => {
        try {
          if (typeof onSubmit == 'function') {
            await onSubmit()
          }
        } catch (error) {
          console.error('Ошибка при выполнении:', error)
          notificationStore.addNotification(
            'При выполнении произошла ошибка',
            'error'
          )
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
})
