import {
  getAllUsersSickLeavesByYear,
  getSickLeavesByYear,
  getSickLeaveStats,
} from '@/services/sick_leave.api'
import { getEntityTypeFiles } from '@/services/files.api'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useNotificationStore } from './notification'
import { useUserStore } from './user'

const createEmptyStats = () => ({
  official: 0,
  unofficial: 0,
})

export const useSickLeaveStore = defineStore('sick-leave', () => {
  const selectedYear = ref(new Date().getFullYear())
  const filter = ref('all')
  const target = ref('my')

  const sickLeaves = ref([])
  const sickLeaveStats = ref(createEmptyStats())
  const isLoading = ref(false)
  // id больничного -> прикреплённые файлы
  const filesBySickLeaveId = ref({})

  const userStore = useUserStore()

  const filteredSickLeaves = computed(() => {
    if (filter.value === 'all') return sickLeaves.value
    return sickLeaves.value.filter((i) => i.status === filter.value)
  })

  // Номер последней загрузки — ответы устаревших загрузок отбрасываем
  let fetchSeq = 0

  const fetchSickLeaves = async () => {
    const seq = ++fetchSeq
    isLoading.value = true
    try {
      const isAll = target.value === 'all'
      const userId = userStore.user.id

      const [list, stats, files] = await Promise.all([
        isAll
          ? getAllUsersSickLeavesByYear(selectedYear.value)
          : getSickLeavesByYear(selectedYear.value, userId),
        isAll
          ? Promise.resolve(null)
          : getSickLeaveStats(selectedYear.value, userId),
        // Файлы одним запросом на весь список, а не по запросу на строку
        getEntityTypeFiles('sick_leave', undefined, isAll ? 'all' : 'my').catch(
          () => []
        ),
      ])
      if (seq !== fetchSeq) return

      sickLeaves.value = list ?? []
      if (!isAll) sickLeaveStats.value = stats ?? createEmptyStats()
      filesBySickLeaveId.value = (files ?? []).reduce((acc, f) => {
        ;(acc[f.entityId] ??= []).push(f)
        return acc
      }, {})
    } catch (error) {
      if (seq !== fetchSeq) return
      console.error('Ошибка загрузки больничных:', error)
      sickLeaves.value = []
      useNotificationStore().addNotification(
        'Не удалось загрузить больничные',
        'error'
      )
    } finally {
      if (seq === fetchSeq) isLoading.value = false
    }
  }

  watch(selectedYear, fetchSickLeaves)
  watch(target, async () => {
    await fetchSickLeaves()
    if (target.value === 'all' && !userStore.usersAll.length) {
      await userStore.userAllFetch()
    }
  })

  return {
    selectedYear,
    filter,
    target,
    sickLeaves,
    sickLeaveStats,
    isLoading,
    filesBySickLeaveId,
    filteredSickLeaves,
    fetchSickLeaves,
  }
})
