<template>
  <div class="birthdays">
    <div
      class="birthday__item"
      v-if="birthdays.length > 0"
      v-for="birthday in birthdays"
    >
      <div class="birthday__item-date">
        {{ getDateNamed(parseDate(birthday.birthday)) }}
      </div>
      <span>—</span>
      <div class="birthday__item-fullname">{{ birthday.fullName }}</div>
    </div>
    <div class="birthday__item-empty" v-else>Дней рождения нет</div>
  </div>
</template>

<script setup>
import { useCalendarStore } from '@/stores/calendar'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { computed } from 'vue'

const userStore = useUserStore()

const calendarStore = useCalendarStore()

const birthdays = computed(() => {
  return userStore.birthdaysByMonth(calendarStore.currentMonth)
})
</script>

<style scoped>
.birthdays {
  display: flex;
  flex-direction: column;
  gap: var(--gap-secondary);
}
.birthdays__title {
  font-size: 1.25rem;
  font-weight: 600;
  padding: 0.71rem;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
.birthday__item {
  display: flex;
  gap: var(--gap-primary);
  padding: 0.71rem;
  font-size: 1.15rem;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.birthday__item span {
  color: var(--muted-text);
}
.birthday__item-fullname {
}
.birthday__item-date {
}
.birthday__item-empty {
  font-size: 1.25rem;
  /* font-weight: 600; */
  padding: 0.71rem;
  color: var(--muted-text);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
</style>
