import {
  assignBusinessCard,
  createBusinessCard,
  deleteBusinessCard,
  getAllBusinessCards,
  getMyBusinessCards,
  releaseBusinessCard,
  updateBusinessCard,
} from '@/services/businessCard.api'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useBusinessCardStore = defineStore('businessCard', () => {
  const target = ref('my')
  // Одноразовый флаг: со страницы карты вернуться на вкладку "Карты", а не "Чеки"
  const returnToCards = ref(false)
  const cards = ref([])
  const isLoading = ref(false)

  const fetchCards = async (all = target.value == 'all') => {
    isLoading.value = true
    try {
      cards.value = (all ? await getAllBusinessCards() : await getMyBusinessCards()) ?? []
    } finally {
      isLoading.value = false
    }
  }

  // Свои карты нужны и в форме чека независимо от вкладки списка
  const myCards = ref([])
  const fetchMyCards = async () => {
    myCards.value = (await getMyBusinessCards()) ?? []
  }
  const myActiveCardOptions = computed(() =>
    myCards.value
      .filter((c) => c.status == 'active')
      .map((c) => ({
        value: c.id,
        label: `•••• ${c.last4}${c.label ? ` · ${c.label}` : ''}`,
      }))
  )

  const getCardLabel = (id) => {
    const c = [...cards.value, ...myCards.value].find((c) => c.id == id)
    return c ? `•••• ${c.last4}${c.label ? ` · ${c.label}` : ''}` : null
  }

  const replaceCard = (updated) => {
    const i = cards.value.findIndex((c) => c.id == updated.id)
    if (i !== -1) cards.value[i] = updated
    return updated
  }

  const addCard = async (data) => {
    await createBusinessCard(data)
    await fetchCards()
  }
  const editCard = async (id, data) =>
    replaceCard(await updateBusinessCard(id, data))
  const removeCard = async (id) => {
    await deleteBusinessCard(id)
    cards.value = cards.value.filter((c) => c.id != id)
  }
  const assignCard = async (id, userId) =>
    replaceCard(await assignBusinessCard(id, userId))
  const releaseCard = async (id) => replaceCard(await releaseBusinessCard(id))

  return {
    target,
    returnToCards,
    cards,
    isLoading,
    myCards,
    myActiveCardOptions,
    fetchCards,
    fetchMyCards,
    getCardLabel,
    addCard,
    editCard,
    removeCard,
    assignCard,
    releaseCard,
  }
})
