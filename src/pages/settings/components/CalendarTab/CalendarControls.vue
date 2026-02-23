<template>
  <div class="controls-calendar">
    <div class="calendar-prev-btn">
      <ButtonUI type="muted" icon="fa-light fa-angle-left" @click="prev" />
    </div>
    <div class="calendar-current">
      <template v-if="viewMode == 'month'">
        {{ currentMonthYearName }}
      </template>
      <template v-else-if="viewMode == 'year'">
        {{ selectedYear }}
      </template>
    </div>
    <div class="calendar-next-btn">
      <ButtonUI type="muted" icon="fa-light fa-angle-right" @click="next" />
    </div>
    <div class="calendar-today-btn">
      <ButtonUI type="muted" @click="setToday">Сегодня</ButtonUI>
    </div>
    <template v-if="type == 'list'">
      <SelectUI v-model="viewMode">
        <option value="month">Месяц</option>
        <option value="year">Год</option>
      </SelectUI>
    </template>
  </div>
</template>

<script setup>
import ButtonUI from "@/components/ButtonUI.vue";
import SelectUI from "@/components/SelectUI.vue";
import { useSettingCalendarStore } from "@/stores/settingCalendar";
import { storeToRefs } from "pinia";

const { type } = defineProps({
  type: {
    default: "calendar",
    type: String,
  },
});

const settingCalendarScore = useSettingCalendarStore();
const { next, prev, setToday } = settingCalendarScore;
const { currentMonthYearName, selectedYear, viewMode } =
  storeToRefs(settingCalendarScore);
</script>

<style scoped>
.controls-calendar {
  display: flex;
  gap: 0.71rem;
  align-items: center;
}
.calendar-current {
  width: 8rem;
  text-align: center;
}
</style>
