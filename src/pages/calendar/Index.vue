<template>
  <div class="container">
    <template v-if="!isMobile">
      <ControlsCalendar :store="calendarStore" />
      <LegendCalendar />
      <div class="container-row">
        <DayListCalendar />
        <StatisticsCalendar />
      </div>
    </template>
    <template v-else>
      <StatisticsCalendar />
      <ControlsCalendar :store="calendarStore" page="calendar-mobile" />
      <div class="tabs">
        <div
          class="tab__item"
          :class="{ active: tabActive == 'calendar' }"
          @click="tabActive = 'calendar'"
        >
          Календарь
        </div>
        <div
          class="tab__item"
          :class="{ active: tabActive == 'birthdays' }"
          @click="tabActive = 'birthdays'"
        >
          Дни рождения
        </div>
      </div>
      <DayListCalendarMobile v-if="tabActive == 'calendar'" />
      <Birthdays v-else-if="tabActive == 'birthdays'" />
    </template>
  </div>
</template>

<script setup>
import StatisticsCalendar from '@/components/Calendar/StatisticsCalendar.vue'
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import LegendCalendar from '@/components/Calendar/LegendCalendar.vue'
import DayListCalendar from '@/components/Calendar/DayListCalendar.vue'
import DayListCalendarMobile from '@/components/Calendar/DayListCalendarMobile.vue'
import Birthdays from '@/components/Calendar/Birthdays.vue'

const isMobile = computed(() => window.innerWidth <= 768)

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Календарь', 'Учёт рабочих дней')

const calendarStore = useCalendarStore()
const userStore = useUserStore()
const route = useRoute()

const tabActive = ref('calendar')

onMounted(async () => {
  const id = route.query.id
  const month = route.query.month
  const year = route.query.year

  if (id && month && year) {
    const user = userStore.usersAll.find((u) => u.id == id)

    if (user) {
      calendarStore.selectedUserId = id
      calendarStore.selectedUser = user
    }

    if (Number(month) > 0 && Number(month) < 13)
      calendarStore.currentDate = new Date(Number(year), Number(month) - 1, 1)

    await calendarStore.initialFetch()
  } else {
    await calendarStore.init()
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
  display: grid;
  grid-template-columns: 1fr auto;
  gap: calc(var(--padding-secondary) / 2);
}

.tabs {
  display: flex;
  width: 100%;
  padding: 0.71rem;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
.tab__item {
  flex: 1;
  text-align: center;
  color: var(--muted-text);
}
.tab__item.active {
  color: var(--text);
  font-weight: 600;
}
</style>
