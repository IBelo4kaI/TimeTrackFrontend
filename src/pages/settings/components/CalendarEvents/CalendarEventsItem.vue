<template>
  <div class="calendar-events-item">
    <div class="item-title">{{ props.item.description }}</div>
    <div class="item-date">
      {{ getDateNamed(new Date(props.item.eventDate)) }}
    </div>
    <div class="item-day-type">
      {{ dayTypeStore.getTypeNameById(props.item.dayTypeId) }}
    </div>
  </div>
</template>

<script setup>
import { useDayTypesStore } from '@/stores/dayTypes'
import { getDateNamed } from '@/utils/calendar.utils'

const props = defineProps({
  item: {
    default: {
      id: 'string',
      eventDate: '2026-04-28T00:00:00Z',
      dayTypeId: 'string',
      description: 'string',
      createdAt: '2026-04-28T00:00:00Z',
      updatedAt: '2026-04-28T00:00:00Z',
    },
  },
})

const dayTypeStore = useDayTypesStore()
</script>

<style scoped></style>
