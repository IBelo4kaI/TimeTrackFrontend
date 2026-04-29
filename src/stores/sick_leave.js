import { getAllUsersSickLeavesByYear, getSickLeavesByYear } from '@/services/sick_leave.api'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useUserStore } from './user'

export const useSickLeaveStore = defineStore('sick-leave', () => {
  const selectedYear = ref(new Date().getFullYear())
  const filter = ref('all')
  const target = ref('my')

  const sickLeaves = ref([])
  const isLoading = ref(false)

  const userStore = useUserStore()

  const filteredSickLeaves = computed(() => {
    if (filter.value === 'all') return sickLeaves.value
    return sickLeaves.value.filter((i) => i.status === filter.value)
  })

  const fetchSickLeaves = async () => {
    if (target.value === 'all') await fetchAllUsersSickLeaves()
    else await fetchUserSickLeaves()
  }

  const fetchUserSickLeaves = async () => {
    isLoading.value = true
    const list = await getSickLeavesByYear(selectedYear.value, userStore.user.id)
    sickLeaves.value = list ?? []
    isLoading.value = false
  }

  const fetchAllUsersSickLeaves = async () => {
    isLoading.value = true
    const list = await getAllUsersSickLeavesByYear(selectedYear.value)
    sickLeaves.value = list ?? []
    isLoading.value = false
  }

  watch(selectedYear, fetchSickLeaves)
  watch(target, async () => {
    await fetchSickLeaves()
    if (target.value === 'all') await userStore.userAllFetch()
  })

  return {
    selectedYear,
    filter,
    target,
    sickLeaves,
    isLoading,
    filteredSickLeaves,
    fetchSickLeaves,
    fetchUserSickLeaves,
    fetchAllUsersSickLeaves,
  }
})
