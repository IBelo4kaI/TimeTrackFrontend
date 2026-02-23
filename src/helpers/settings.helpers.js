import { MONTH_NAMES } from '@/constants/calendar.constants'
import { useSettingStore } from '@/stores/settings'
import { storeToRefs } from 'pinia'

export const findChangesAPIStandard = () => {
  const settingStore = useSettingStore()
  const { standardsData, standards } = storeToRefs(settingStore)

  if (!standards.value) {
    return []
  }

  const changes = []

  standards.value.forEach((month) => {
    // мужчины
    if (standardsData.value == null) {
      if (month.hoursMen > 0) {
        changes.push({
          id: null,
          month: month.index,
          year: month.year,
          genderId: 1,
          hours: month.hoursMen,
        })
      }

      if (month.hoursWomen > 0) {
        changes.push({
          id: null,
          month: month.index,
          year: month.year,
          genderId: 2,
          hours: month.hoursWomen,
        })
      }

      return
    }

    const apiMen = standardsData.value.find(
      (item) =>
        item.month === month.index &&
        item.year === month.year &&
        item.genderId === 1
    )

    if (!apiMen) {
      if (month.hoursMen > 0) {
        changes.push({
          id: null,
          month: month.index,
          year: month.year,
          genderId: 1,
          hours: month.hoursMen,
        })
      }
    } else if (apiMen.hours !== month.hoursMen) {
      changes.push({
        id: apiMen.id,
        month: month.index,
        year: month.year,
        genderId: 1,
        hours: month.hoursMen,
      })
    }

    // женщины
    const apiWomen = standardsData.value.find(
      (item) =>
        item.month === month.index &&
        item.year === month.year &&
        item.genderId === 2
    )

    if (!apiWomen) {
      if (month.hoursWomen > 0) {
        changes.push({
          id: null,
          month: month.index,
          year: month.year,
          genderId: 2,
          hours: month.hoursWomen,
        })
      }
    } else if (apiWomen.hours !== month.hoursWomen) {
      changes.push({
        id: apiWomen.id,
        month: month.index,
        year: month.year,
        genderId: 2,
        hours: month.hoursWomen,
      })
    }
  })

  return changes
}

export const findAPIStandardForMonth = (month, genderId) => {
  const settingStore = useSettingStore()
  const { standardsData, selectedYear } = storeToRefs(settingStore)

  if (standardsData.value == null) {
    return null
  }

  return standardsData.value.filter(
    (item) =>
      item.month === month &&
      item.year === selectedYear &&
      item.gender == genderId
  )
}

export const generateStandardForYear = (year) => {
  const months = []
  const totalMonths = MONTH_NAMES.length

  for (let i = 1; i <= totalMonths; i++) {
    const apiData = findAPIStandardForMonth(i, year)
    const month = createStandardObject(i, MONTH_NAMES[i - 1], 0, 0, year)
    if (apiData) {
      apiData.forEach((item) => {
        if (item.genderId == 1) {
          month.hoursMen = item.hours
        } else if (item.genderId == 2) {
          month.hoursWomen = item.hours
        }
        month.id = item.id
      })
    }
    months.push(month)
  }

  return months
}

const createStandardObject = (
  indexMonth,
  nameMonth,
  hoursMen,
  hoursWomen,
  year
) => ({
  index: indexMonth,
  name: nameMonth,
  year: year,
  hoursMen: hoursMen,
  hoursWomen: hoursWomen,
})
