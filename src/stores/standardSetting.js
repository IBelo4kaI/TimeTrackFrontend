import { getStandardsByYear } from '@/services/workStandard.api'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStandardSetting = defineStore('standard-settings', () => {
  const selectedYear = ref(new Date().getFullYear())
  const standardsData = ref([])
  const isLoading = ref(false)

  const initialFetch = async () => {
    isLoading.value = true
    standardsData.value = await getStandardsByYear(selectedYear.value)
    isLoading.value = false
  }

  const getStandard = (month, gender) => {
    const standard = standardsData.value.find(
      (s) =>
        !s.userId.Valid &&
        s.month == month &&
        s.year == selectedYear.value &&
        s.gender == gender
    )
    return standard
  }

  return {
    selectedYear,
    standardsData,
    initialFetch,
    getStandard,
    isLoading,
  }
})
