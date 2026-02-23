<template>
  <div class="legend">
    <template v-for="dayType in dayTypesStore.dayTypes">
      <div class="legend-item">
        <div
          class="legend-circle"
          :style="{ background: dayType[1].colorCode }"
        ></div>
        <span>{{ dayType[1].name }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useDayTypesStore } from '@/stores/dayTypes'

const dayTypesStore = useDayTypesStore()
</script>

<style scoped>
.legend {
  display: flex;
  gap: 0.71rem;
  padding: 0.5rem var(--padding-secondary);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  background: var(--foreground);
  font-size: 0.85rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.legend-circle {
  display: block;
  height: 0.85rem;
  width: 0.85rem;
  border-radius: 50%;
  border: 0.07rem solid var(--border-color);
}
.legend-weekend {
  background: var(--calendar-weekend);
}
.legend-work {
  background: var(--calendar-work);
}
.legend-vacation {
  background: var(--calendar-vacation);
}
.legend-medical {
  background: var(--calendar-medical);
}
.legend-decree {
  background: var(--calendar-decree);
}
.legend-time-off {
  background: var(--calendar-time-off);
}
.legend-holyday {
  background: var(--calendar-holiday);
}
.legend-preholyday {
  background: var(--calendar-muted-preholiday);
}
</style>
