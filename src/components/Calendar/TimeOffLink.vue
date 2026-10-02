<template>
  <ButtonUI
    v-if="range"
    type="accent"
    icon="fa-regular fa-file-word"
    class="time-off-link"
    @click="openTemplate"
  >
    <span>Заявление на отгул</span>
  </ButtonUI>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useSelectingStore } from '@/stores/selecting'
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const calendarStore = useCalendarStore()
const dayTypesStore = useDayTypesStore()
const selectingStore = useSelectingStore()
const userStore = useUserStore()

const toDay = (day) => String(day.date).slice(0, 10)

// Период по выбранным дням с отгулом; заявление — только на свои дни
const range = computed(() => {
  if (
    !userStore.hasPermission('docs', 'read') ||
    calendarStore.selectedUserId !== userStore.user?.id
  )
    return null

  const timeOffId = dayTypesStore.getDayTypeIdByName('time-off')
  const dates = selectingStore.selectedArray
    .filter((day) => day.userTimeTypeId === timeOffId)
    .map(toDay)
    .sort()

  if (!dates.length) return null
  return { dateFrom: dates[0], dateTo: dates[dates.length - 1] }
})

const openTemplate = () => {
  router.push({
    name: 'docs',
    query: { template: 'timeoff', ...range.value },
  })
}
</script>

<style scoped>
.time-off-link {
  width: 100%;
}
</style>
