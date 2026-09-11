import {
  getAllUserVacationsByYear,
  getVacationsByYear,
  getVacationStats,
} from '@/services/vacation.api'
import { parseDate } from '@/utils/date.utils'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useUserStore } from './user'

const createEmptyStats = () => ({
  used: 0,
  pending: 0,
  free: 0,
})

export const useVacationStore = defineStore('vacation', () => {
  const selectedYear = ref(new Date().getFullYear())
  // null = весь год, иначе 1-12 (как selectedMonth в stores/receipt.js)
  const selectedMonth = ref(new Date().getMonth() + 1)
  const filter = ref('all')
  const target = ref('my')

  const vacations = ref([])
  const vacationStats = ref(createEmptyStats())

  const isLoading = ref(false)
  const userStore = useUserStore()

  const filterVacations = computed(() => {
    return vacations.value.filter((i) => {
      if (filter.value != 'all' && i.status != filter.value) return false

      // Отпуск — это диапазон [startDate, endDate], а не одна дата, поэтому
      // "попадает в месяц" значит "пересекается с выбранным месяцем", а не
      // "начинается в нём" (иначе пропадали бы отпуска, переходящие через
      // границу месяца).
      if (selectedMonth.value) {
        const start = parseDate(i.startDate)
        const end = parseDate(i.endDate)
        const monthStart = new Date(selectedYear.value, selectedMonth.value - 1, 1)
        const monthEnd = new Date(selectedYear.value, selectedMonth.value, 0)
        if (end < monthStart || start > monthEnd) return false
      }

      return true
    })
  })

  const fetchVacations = async () => {
    if (target.value == 'all') await fetchAllUserVacations()
    else if (target.value == 'my') await fetchUserVacations()
  }

  /* ================== fetch ================== */
  const fetchUserVacations = async () => {
    isLoading.value = true
    const [stats, list] = await Promise.all([
      getVacationStats(selectedYear.value, userStore.user.id),
      getVacationsByYear(selectedYear.value, userStore.user.id),
    ])

    vacationStats.value = stats ?? createEmptyStats()
    vacations.value = list ?? []
    isLoading.value = false
  }

  const fetchAllUserVacations = async () => {
    isLoading.value = true
    const list = await getAllUserVacationsByYear(selectedYear.value)
    console.log(list)

    vacations.value = list ?? []
    isLoading.value = false
  }

  /* ================== actions ================== */
  const changeVacationStatus = async (id, action) => {}

  const removeVacation = async (id) => {}

  watch(selectedYear, async () => {
    await fetchVacations()
  })

  watch(target, async () => {
    await fetchVacations()
    if (target.value == 'all') await userStore.userAllFetch()
  })

  return {
    // state
    selectedYear,
    selectedMonth,
    vacations,
    vacationStats,
    isLoading,
    filterVacations,
    filter,
    target,

    // actions
    fetchVacations,
    fetchAllUserVacations,
    fetchUserVacations,
    changeVacationStatus,
    removeVacation,
  }
})
