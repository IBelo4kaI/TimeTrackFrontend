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
    <MonthYearSelect
      class="calendar-current"
      align="center"
      :allow-all-months="false"
      v-model:month="monthDraft"
      v-model:year="yearDraft"
    />
    <div class="calendar-today-btn">
      <ButtonUI type="muted" @click="setTodayHandler">Сегодня</ButtonUI>
    </div>
  </div>
</template>

<script setup>
import MonthYearSelect from '@/components/MonthYearSelect.vue'
import { isCurrentDate } from '@/utils/calendar.utils'
import { ref, watch } from 'vue'
import ButtonUI from '../ButtonUI.vue'

const model = defineModel({
  default: new Date(),
})

const emit = defineEmits(['change'])

// MonthYearSelect отдаёт месяц и год отдельными v-model (при выборе месяца
// в панели присваивает их по очереди — см. selectMonth в MonthYearSelect.vue),
// поэтому здесь черновики, а не прямая запись в model на каждое присваивание:
// иначе на один клик по месяцу ушло бы два @change (и, соответственно, два
// fetch у потребителей вроде ControlsCalendar.vue) — сперва с неверным годом,
// потом с верным.
const monthDraft = ref(model.value.getMonth() + 1)
const yearDraft = ref(model.value.getFullYear())

// Внешние изменения model (стрелки/"Сегодня") — синхронизируем черновики.
watch(model, (date) => {
  monthDraft.value = date.getMonth() + 1
  yearDraft.value = date.getFullYear()
})

// watch без flush:'sync' схлопывает оба синхронных присваивания
// (month и следом year) в один вызов — на выходе один commit в model.
watch([monthDraft, yearDraft], ([month, year]) => {
  const next = new Date(year, month - 1, 1)
  if (next.getTime() === model.value.getTime()) return
  model.value = next
  changeHandler()
})

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

@media (max-width: 768px) {
  .controls-calendar {
  }
  /* .calendar-current теперь сам MonthYearSelect (flex-column .select-field
     внутри) — text-align тут не центрирует flex-детей, нужен align-items. */
  .calendar-current {
    flex: 1;
    align-items: center;
  }
}
</style>
