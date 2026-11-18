<template>
  <div class="container">
    <DayEditor />
    <template v-if="!isMobile">
      <ControlsCalendar :store="calendarStore" />
      <LegendCalendar />
      <div class="container-row">
        <DayListCalendar />
        <div class="container-column">
          <StatisticsCalendar />
          <TimeOffLink />
          <Birthdays />
          <SantaSnowball v-if="decorations.enabled" />
        </div>
      </div>
    </template>
    <template v-else>
      <StatisticsCalendar />
      <TimeOffLink />
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
import DayEditor from '@/components/Calendar/DayEditor.vue'
import { useDayEditorStore } from '@/stores/dayEditor'
import Birthdays from '@/components/Calendar/Birthdays.vue'
import SantaSnowball from '@/components/Calendar/SantaSnowball.vue'
import DayListCalendar from '@/components/Calendar/DayListCalendar.vue'
import DayListCalendarMobile from '@/components/Calendar/DayListCalendarMobile.vue'
import LegendCalendar from '@/components/Calendar/LegendCalendar.vue'
import StatisticsCalendar from '@/components/Calendar/StatisticsCalendar.vue'
import TimeOffLink from '@/components/Calendar/TimeOffLink.vue'
import ControlsCalendar from '@/components/ControlsCalendar.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/themes'
import { useHolidayDecorationsStore } from '@/stores/holidayDecorations'
import { computed, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'

const themeStore = useThemeStore()
const isMobile = computed(() => themeStore.isMobile)
const decorations = useHolidayDecorationsStore()

const titleStore = useHeaderTitleStore()
titleStore.setTitle('Календарь', 'Учёт рабочих дней')

const calendarStore = useCalendarStore()
const userStore = useUserStore()
const route = useRoute()

const dayEditor = useDayEditorStore()
onBeforeRouteLeave(() => dayEditor.close())
onBeforeRouteUpdate(() => dayEditor.close())

const tabActive = ref('calendar')

watch(() => [route.query.id, route.query.month, route.query.year], async ([id, month, year]) => {
  if (typeof id === 'string' && id) {
    calendarStore.selectedUserId = id
    calendarStore.selectedUser = userStore.usersAll.find((user) => user.id === id) ?? { id }
    if (Number.isInteger(Number(month)) && Number(month) >= 1 && Number(month) <= 12
      && Number.isInteger(Number(year)) && Number(year) >= 1 && Number(year) <= 9999) {
      calendarStore.currentDate = new Date(Number(year), Number(month) - 1, 1)
    }
    await calendarStore.initialFetch()
  } else {
    await calendarStore.init()
  }
}, { immediate: true })

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
.container-column {
  display: flex;
  flex-direction: column;
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
@media screen and (min-width: 769px) {
  .container { min-height: 0; min-width: 0; }
  .container > :not(.container-row) { flex-shrink: 0; }
  .container-row {
    flex: 1;
    min-height: 0;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: minmax(0, 1fr);
  }
  .container-column { min-height: 0; overflow-y: auto; }
  .container-column > * { flex-shrink: 0; }
}
</style>
