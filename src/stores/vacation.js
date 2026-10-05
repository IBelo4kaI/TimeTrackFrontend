import {
  getAllUserVacationsByYear,
  getVacationsByYear,
  getVacationStats,
} from '@/services/vacation.api'
import { getEntityTypeFiles } from '@/services/files.api'
import { parseDate } from '@/utils/date.utils'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useNotificationStore } from './notification'
import { useUserStore } from './user'

const createEmptyStats = () => ({
  used: 0,
  pending: 0,
  free: 0,
})

export const useVacationStore = defineStore('vacation', () => {
  const selectedYear = ref(new Date().getFullYear())
  // null = весь год, иначе 1-12 (как selectedMonth в stores/receipt.js)
  const selectedMonth = ref(null)
  const filter = ref('all')
  const target = ref('my')

  const vacations = ref([])
  const vacationStats = ref(createEmptyStats())
  const upcomingVacations = ref([])
  // id отпусков, к которым прикреплён файл
  const vacationIdsWithFiles = ref(new Set())

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

  // Номер последней загрузки — ответы устаревших загрузок отбрасываем
  let fetchSeq = 0

  const fetchVacations = async () => {
    const seq = ++fetchSeq
    isLoading.value = true
    try {
      const isAll = target.value == 'all'
      const nowYear = new Date().getFullYear()
      const userId = userStore.user.id

      const [list, stats, upcoming, files] = await Promise.all([
        isAll
          ? getAllUserVacationsByYear(selectedYear.value)
          : getVacationsByYear(selectedYear.value, userId),
        isAll
          ? Promise.resolve(null)
          : getVacationStats(selectedYear.value, userId),
        // Ближайший отпуск не зависит от выбранного в списке года
        Promise.all([
          getVacationsByYear(nowYear, userId),
          getVacationsByYear(nowYear + 1, userId),
        ]).catch(() => []),
        // Файлы грузим один раз на весь список, а не по запросу на строку;
        // без года: год файла — это год загрузки, а не год отпуска
        getEntityTypeFiles('vacation', undefined, isAll ? 'all' : 'my').catch(
          () => []
        ),
      ])
      if (seq !== fetchSeq) return

      vacations.value = list ?? []
      if (!isAll) vacationStats.value = stats ?? createEmptyStats()
      upcomingVacations.value = (upcoming ?? []).flatMap((l) => l ?? [])
      vacationIdsWithFiles.value = new Set((files ?? []).map((f) => f.entityId))
    } catch (error) {
      if (seq !== fetchSeq) return
      console.error('Ошибка загрузки отпусков:', error)
      vacations.value = []
      useNotificationStore().addNotification(
        'Не удалось загрузить отпуска',
        'error'
      )
    } finally {
      if (seq === fetchSeq) isLoading.value = false
    }
  }

  // Ближайший утверждённый отпуск текущего пользователя
  const nextVacation = computed(() => {
    const now = new Date()
    return (
      upcomingVacations.value
        .filter((v) => v.status === 'approved' && parseDate(v.startDate) >= now)
        .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))[0] ??
      null
    )
  })

  watch(selectedYear, fetchVacations)
  watch(target, async () => {
    await fetchVacations()
    if (target.value == 'all' && !userStore.usersAll.length) {
      await userStore.userAllFetch()
    }
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

    nextVacation,
    vacationIdsWithFiles,

    // actions
    fetchVacations,
  }
})
