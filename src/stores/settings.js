import {
  findChangesAPIStandard,
  generateStandardForYear,
} from '@/helpers/settings.helpers'

import { defineStore } from 'pinia'
import { computed, ref, triggerRef, watch } from 'vue'
import { useNotificationStore } from './notification'
import { getStandardsByYear } from '@/services/workStandard.api'

export const useSettingStore = defineStore('setting', () => {
  const selectedYear = ref(new Date().getFullYear())
  const standardsData = ref(null)

  const notificationStore = useNotificationStore()

  // Init
  const initialFetch = async () => {
    standardsData.value = await getStandardsByYear(selectedYear.value)
  }

  const standards = computed(() => generateStandardForYear(selectedYear.value))

  const updateStandards = async () => {
    const changes = findChangesAPIStandard()
    console.log(changes)

    if (!changes.length) return

    // for (const item of changes) {
    //   if (item.id != null) {
    //     await updateStandard(item.id, item.hours)
    //   } else {
    //     await createStandard(item.month, item.year, item.hours, item.genderId)
    //   }
    // }

    await initialFetch()
    notificationStore.addNotification('Данные обновлены', 'success', 3000)
  }

  initialFetch()

  watch(selectedYear, async () => {
    await initialFetch()
  })

  return {
    selectedYear,
    standards,
    standardsData,

    initialFetch,
    updateStandards,
  }
})
