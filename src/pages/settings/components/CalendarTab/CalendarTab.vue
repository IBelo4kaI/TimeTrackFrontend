<template>
  <div class="calendar-tabs">
    <Tabs :tabs="tabs" v-model="activeTab" @tab-change="onChangeTab" />
  </div>

  <CalendarControls :type="activeTab" />
  <LegendCalendar type="setting" />

  <template v-if="activeTab == 'calendar'">
    <CalendarSettingComponent />
  </template>
  <template v-else-if="activeTab == 'list'">
    <CalendarList />
  </template>
</template>

<script setup>
import Tabs from "@/components/Tabs.vue";
import { onMounted, ref } from "vue";
import CalendarSettingComponent from "./CalendarComponent.vue";
import CalendarControls from "./CalendarControls.vue";
import CalendarList from "./CalendarList.vue";
import { useSettingCalendarStore } from "@/stores/settingCalendar";
import LegendCalendar from "@/components/Calendar/LegendCalendar.vue";

const settingStore = useSettingCalendarStore();

const activeTab = ref("calendar");

const tabs = [
  { id: "calendar", label: "Календарь" },
  { id: "list", label: "Список" },
];

const onChangeTab = (tabId) => {
  switch (tabId) {
    case "calendar":
      settingStore.viewMode = "month";
      break;
    case "list":
      settingStore.viewMode = "year";
      break;
  }
};

onMounted(() => {
  settingStore.viewMode = "month";
});
</script>

<style scoped>
.calendar-tabs {
  display: flex;
  justify-content: space-between;
  gap: 0.71rem;
  /* padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius); */
}
</style>
