<template>
  <div class="calendar-list">
    <CalendarItem
      v-for="data in calendarList"
      :data="data"
      v-if="calendarList != null"
    />
    <div class="calendar-empty" v-else-if="calendarList == null">
      Данных нет
    </div>
  </div>
</template>

<script setup>
import { useSettingCalendarStore } from "@/stores/settingCalendar";
import { storeToRefs } from "pinia";
import CalendarItem from "./CalendarItem.vue";

const settingStore = useSettingCalendarStore();
const { calendarList } = storeToRefs(settingStore);
</script>

<style scoped>
.calendar-list {
  overflow: auto;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
.calendar-empty {
  padding: var(--padding-secondary);
  background: var(--foreground);
  text-align: center;
}
</style>
