<template>
  <div class="controls-calendar">
    <div class="calendar-prev-btn">
      <ButtonUI
        type="muted"
        icon="fa-light fa-angle-left"
        @click="prevMonthHandler"
      />
    </div>
    <div class="calendar-next-btn">
      <ButtonUI
        type="muted"
        icon="fa-light fa-angle-right"
        @click="nextMonthHandler"
      />
    </div>
    <div class="calendar-current">{{ getMonthYearName(model) }}</div>
    <div class="calendar-today-btn">
      <ButtonUI type="muted" @click="setTodayHandler">Сегодня</ButtonUI>
    </div>
  </div>
</template>

<script setup>
import { getMonthYearName, isCurrentDate } from '@/utils/calendar.utils'
import ButtonUI from '../ButtonUI.vue'

const model = defineModel({
  default: new Date(),
})

const emit = defineEmits(['change'])

const nextMonthHandler = () => {
  model.value = new Date(
    model.value.getFullYear(),
    model.value.getMonth() + 1,
    1
  )
  changeHandler()
}

const prevMonthHandler = () => {
  model.value = new Date(
    model.value.getFullYear(),
    model.value.getMonth() - 1,
    1
  )
  changeHandler()
}

const setTodayHandler = () => {
  if (!isCurrentDate(model.value)) {
    model.value = new Date()
    changeHandler()
  }
}

const changeHandler = () => {
  emit('change', model.value)
}
</script>

<style scoped>
.controls-calendar {
  flex: 1;
  display: flex;
  gap: 0.71rem;
  align-items: center;
}
</style>
