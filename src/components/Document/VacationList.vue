<template>
  <AppTable :headers="headers" :rows="items"></AppTable>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import AppTable from '../AppTable.vue'
import { getEntityTypeFiles } from '@/services/files.api'

const items = ref([])

const headers = [
  { valueKey: 'originalName', title: 'Статус' },
  { valueKey: 'date_start', title: 'Дата начала' },
  { valueKey: 'date_end', title: 'Дата конца' },
  { valueKey: 'totalDays', title: 'Дней' },
  { valueKey: 'description', title: 'Комментарий' },
  { valueKey: 'createdAt', title: 'Создано' },
]

onMounted(async () => {
  items.value = await getEntityTypeFiles('vacation')
})
</script>
<style scoped></style>
