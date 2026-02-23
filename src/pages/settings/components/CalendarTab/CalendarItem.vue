<template>
  <div :class="['item-container', data.typeSystemName]">
    <div class="item-icon">
      <i class="fa-solid fa-circle"></i>
    </div>
    <div class="item-content">
      <div class="item-title">{{ data.description ?? data.typeName }}</div>
      <div class="item-desc">
        {{ getDateNamed(date) + " " + date.getFullYear() }},
        {{ getDayOfWeekNamed(date, false) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { getDateNamed, getDayOfWeekNamed } from "@/utils/calendar.utils";
import { computed } from "vue";

const { data } = defineProps({
  data: {
    default: {},
    type: Object,
  },
});

const date = computed(() => new Date(data.year, data.month - 1, data.day));
</script>

<style scoped>
.item-container {
  display: flex;
  align-items: center;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-top: 0.07rem solid var(--border-color);
}
.item-container:first-child {
  border-top: none;
}
.item-container:hover {
  background: var(--muted-foreground);
}
.item-container.holiday .item-icon {
  color: var(--calendar-holiday);
}
.item-container.weekend .item-icon {
  color: var(--calendar-weekend);
}
.item-container.preholiday .item-icon {
  color: var(--calendar-muted-preholiday);
}
.item-icon {
  font-size: 0.71rem;
}
.item-content {
}
.item-title {
}
.item-desc {
}
</style>
