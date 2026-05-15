<template>
  <div class="container">
    <ControlsCalendar :store="calendarStore" />
    <LegendCalendar />
    <div class="container-row">
      <DayListCalendar style="flex: 1" />
      <StatisticsCalendar />
    </div>
  </div>
</template>

<script setup>
import StatisticsCalendar from '@/components/Calendar/StatisticsCalendar.vue'
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import LegendCalendar from '../../components/Calendar/LegendCalendar.vue'
import DayListCalendar from './components/DayListCalendar.vue'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRoute } from 'vue-router'

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Календарь', 'Учёт рабочих дней')

const calendarStore = useCalendarStore()
const userStore = useUserStore()
const route = useRoute()

onMounted(() => {
  const id = route.query.id

  if (id) {
    const user = userStore.usersAll.find((u) => u.id == id)

    if (user) {
      calendarStore.selectedUserId = id
      calendarStore.selectedUser = user
    }
  } else {
    console.log("fsd");
    
    route.query.id = calendarStore.selectedUserId
  }
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}
.container-row {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
}
</style>
