import { getDayTypes } from '@/services/dayTypes.api'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useDayTypesStore = defineStore('day-types', () => {
  const dayTypes = shallowRef(new Map())

  const isLoading = shallowRef(false)

  const fetch = async () => {
    const dayTypesData = await getDayTypes()
    dayTypes.value = new Map(dayTypesData.map((day) => [day.id, day]))
    sessionStorage.setItem('dayTypes', JSON.stringify(dayTypesData))
  }

  const load = async () => {
    const localDayTypes = sessionStorage.getItem('dayTypes')
    if (localDayTypes != null) {
      dayTypes.value = new Map(
        JSON.parse(localDayTypes).map((day) => [day.id, day])
      )
      return
    }
    await fetch()
  }

  const getColorById = (id) => {
    const dayType = dayTypes.value.get(id)
    return dayType ? dayType.colorCode : null
  }

  const getTypeNameById = (id) => {
    const dayType = dayTypes.value.get(id)
    return dayType ? dayType.name : null
  }

  const getUserEditTypes = () => {
    const res = []
    for (let dayType of dayTypes.value.values()) {
      if (dayType.isUserSelect) res.push(dayType)
    }
    return res
  }

  const getDayTypeIdByName = (name) => {
    for (let dayType of dayTypes.value.values()) {
      if (dayType.systemName === name) return dayType.id
    }
  }

  const getDayTypeById = (id) => {
    return dayTypes.value.get(id)
  }

  return {
    dayTypes,
    isLoading,
    fetch,
    load,
    getColorById,
    getTypeNameById,
    getUserEditTypes,
    getDayTypeById,
    getDayTypeIdByName,
  }
})
