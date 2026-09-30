import Autocomplete from '@/components/Autocomplete.vue'
import { Mask } from 'maska'
import { useBusinessCardStore } from '@/stores/businessCard'
import { useConfirmModal } from '@/stores/confirmModal'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Активна' },
  { value: 'blocked', label: 'Заблокирована' },
]

const errorMessage = (err, fallback) => err?.message || fallback

export const getUserFullName = (userId) => {
  const u = useUserStore().usersAll?.find((u) => u.id == userId)
  if (!u) return '—'
  return [u.surname, u.name, u.patronymic].filter(Boolean).join(' ')
}

const digits = (v) => String(v ?? '').replace(/\D/g, '')

const MASK_CARD_NUMBER = {
  mask: ['#### #### #### ####', '#### #### #### #### ###'],
}
const cardNumberMask = new Mask(MASK_CARD_NUMBER)

export const formatCardNumber = (v) => cardNumberMask.masked(v ?? '')

const MASK_EXPIRY = { mask: '##/##' }
const MASK_MONEY = { number: { locale: 'ru', fraction: 2, unsigned: true } }
const MASK_HOLDER = {
  mask: 'A',
  tokens: {
    A: {
      pattern: /[A-Za-zА-Яа-яЁё .'-]/,
      multiple: true,
      transform: (c) => c.toUpperCase(),
    },
  },
}

// "1 000,50" -> 1000.5 (рубли, пробелы могут быть неразрывными)
const parseMoney = (v) =>
  Number(String(v).replace(/[\s\u00a0]/g, '').replace(',', '.'))

const validateCardNumber = (v) => {
  const n = digits(v).length
  return v && (n < 13 || n > 19) ? 'Номер карты: от 13 до 19 цифр' : null
}

const validateExpiry = (v) => {
  if (!v) return null
  const m = /^(\d{2})\/(\d{2})$/.exec(v)
  return m && +m[1] >= 1 && +m[1] <= 12 ? null : 'Формат ММ/ГГ'
}

function fieldsFor(card) {
  return [
    {
      name: 'number',
      type: 'text',
      label: 'Номер карты',
      required: !card,
      value: '',
      placeholder: card ? `•••• ${card.last4}` : '0000 0000 0000 0000',
      mask: MASK_CARD_NUMBER,
      validators: [validateCardNumber],
      hint: card ? 'Оставьте пустым, чтобы не менять' : undefined,
    },
    { name: 'label', type: 'text', label: 'Название', value: card?.label ?? '' },
    { name: 'bank', type: 'text', label: 'Банк', value: card?.bank ?? '' },
    {
      name: 'holderName',
      type: 'text',
      label: 'Держатель',
      placeholder: 'IVAN IVANOV',
      mask: MASK_HOLDER,
      value: card?.holderName ?? '',
    },
    {
      name: 'expiry',
      type: 'text',
      label: 'Срок действия',
      placeholder: 'ММ/ГГ',
      mask: MASK_EXPIRY,
      validators: [validateExpiry],
      value: card?.expiry ?? '',
    },
    {
      name: 'cardLimit',
      type: 'text',
      label: 'Лимит, ₽',
      mask: MASK_MONEY,
      value:
        card?.cardLimit != null
          ? (card.cardLimit / 100).toLocaleString('ru-RU')
          : '',
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      options: STATUS_OPTIONS,
      value: card?.status ?? 'active',
    },
  ]
}

function normalize(data) {
  const limit = data.cardLimit
  return {
    number: (data.number ?? '').trim(),
    label: data.label || null,
    bank: data.bank || null,
    holderName: data.holderName || null,
    expiry: data.expiry || null,
    cardLimit:
      limit === '' || limit == null ? null : Math.round(parseMoney(limit) * 100),
    status: data.status || 'active',
  }
}

// Админские действия над картой (создание, правка, выдача, удаление) —
// общие для списка и страницы карты. onDone получает результат действия.
export function useBusinessCardActions() {
  const store = useBusinessCardStore()
  const modalStore = useUniversalModalStore()
  const confirmModalStore = useConfirmModal()
  const notificationStore = useNotificationStore()
  const userStore = useUserStore()

  const notifyError = (err, fallback) =>
    notificationStore.addNotification(errorMessage(err, fallback), 'error')

  function openCreateModal(onDone) {
    modalStore.open({
      title: 'Новая карта',
      submitButtonText: 'Создать',
      submittingText: 'Создание...',
      fields: fieldsFor(null),
      onSubmit: async (data) => {
        try {
          await store.addCard(normalize(data))
        } catch (err) {
          notifyError(err, 'Не удалось создать карту')
          throw err
        }
        notificationStore.addNotification('Карта создана', 'success')
        onDone?.()
      },
    })
  }

  function openEditModal(card, onDone) {
    modalStore.open({
      title: 'Карта',
      submitButtonText: 'Сохранить',
      submittingText: 'Сохранение...',
      fields: fieldsFor(card),
      onSubmit: async (data) => {
        let updated
        try {
          updated = await store.editCard(card.id, normalize(data))
        } catch (err) {
          notifyError(err, 'Не удалось сохранить карту')
          throw err
        }
        notificationStore.addNotification('Карта сохранена', 'success')
        onDone?.(updated)
      },
    })
  }

  function openAssignModal(card, onDone) {
    const employeeOptions = (userStore.usersAll ?? [])
      .map((u) => ({ value: u.id, label: getUserFullName(u.id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))

    modalStore.open({
      title: `Выдать карту •••• ${card.last4}`,
      submitButtonText: 'Выдать',
      submittingText: 'Выдача...',
      fields: [
        {
          name: 'userId',
          type: 'component',
          component: Autocomplete,
          label: 'Сотрудник',
          required: true,
          value: card.ownerId ?? '',
          props: {
            options: employeeOptions,
            labelKey: 'label',
            valueKey: 'value',
            isShowButton: false,
            placeholder: 'Найти сотрудника',
            emptyText: 'Сотрудник не найден',
          },
        },
      ],
      onSubmit: async (data) => {
        let updated
        try {
          updated = await store.assignCard(card.id, data.userId)
        } catch (err) {
          notifyError(err, 'Не удалось выдать карту')
          throw err
        }
        notificationStore.addNotification('Карта выдана', 'success')
        onDone?.(updated)
      },
    })
  }

  function confirmDelete(card, onDone) {
    confirmModalStore.open(async () => {
      try {
        await store.removeCard(card.id)
      } catch (err) {
        notifyError(err, 'Не удалось удалить карту')
        return
      }
      notificationStore.addNotification('Карта удалена', 'success')
      onDone?.()
    }, 'Удалить карту? Чеки останутся, но потеряют привязку к ней.')
  }

  return { openCreateModal, openEditModal, openAssignModal, confirmDelete }
}
