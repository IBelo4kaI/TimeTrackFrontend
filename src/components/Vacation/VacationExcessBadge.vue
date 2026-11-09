<template>
  <Badge v-if="days > 0" type="warn" v-tooltip="'Превышение доступного остатка на момент подачи заявки'">
    Сверх лимита: {{ formatStats(days) }}
  </Badge>
</template>

<script setup>
import Badge from '@/components/Badge.vue'
import { formatStats } from '@/utils/vacation.utils'

defineProps({ days: { type: Number, default: 0 } })
</script>
