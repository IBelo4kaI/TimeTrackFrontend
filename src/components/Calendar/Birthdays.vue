<template>
  <div class="birthdays">
    <div class="birthdays__title">Дни рождения</div>
    <div class="birthdays__list" v-if="birthdays.length > 0">
      <div
        class="birthday__item"
        v-for="birthday in birthdays"
        :class="[
          {
            'day-birthday-hovered':
              parseDate(birthday.birthday).getDate() ==
              calendarStore.hoveredBirthday,
          },
        ]"
        @mouseenter="calendarStore.hoverBirthday(birthday.birthday)"
        @mouseleave="calendarStore.resetHoveredBirthday"
      >
        <div class="birthday__item-date">
          {{ getDateNamed(parseDate(birthday.birthday)) }}
        </div>
        <span>—</span>
        <div class="birthday__item-fullname">{{ birthday.fullName }}</div>
      </div>
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

const isBirthdayHovered = computed(
  () => dayDate.value.getDate() == calendarStore.hoveredBirthday
)
</script>

<style scoped>
.birthdays {
  display: flex;
  flex-direction: column;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}
.birthdays__title {
  font-size: 1rem;
  font-weight: 600;
  padding: 0.71rem;
  border-bottom: 0.07rem solid var(--border-color);
}
.birthdays__list {
  display: flex;
  flex-direction: column;
}
.birthday__item {
  display: flex;
  align-items: baseline;
  gap: var(--gap-primary);
  padding: 0.71rem;
  font-size: 0.9rem;
  transition: background 0.2s ease;
}
.birthday__item:hover {
  background: var(--muted-accent);
  cursor: default;
}
.birthday__item + .birthday__item {
  border-top: 0.07rem solid var(--border-color);
}
.day-birthday-hovered {
  background: var(--muted-accent);
}

.birthday__item span {
  color: var(--muted-text);
}
.birthday__item-date {
  flex-shrink: 0;
  color: var(--muted-text);
}
.birthday__item-fullname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.birthday__item-empty {
  font-size: 0.9rem;
  padding: 0.71rem;
  color: var(--muted-text);
}

@media (max-width: 768px) {
  .birthdays {
    background: none;
    border: none;
    border-radius: 0;
    overflow: visible;
    gap: var(--gap-secondary);
  }
  .birthdays__title {
    display: none;
  }
  .birthdays__list {
    gap: var(--gap-secondary);
  }
  .birthday__item {
    font-size: 1.15rem;
    background: var(--foreground);
    border: 0.07rem solid var(--border-color);
    border-radius: var(--border-radius);
  }
  .birthday__item + .birthday__item {
    border-top: 0.07rem solid var(--border-color);
  }
  .birthday__item-fullname {
    white-space: normal;
  }
  .birthday__item-empty {
    font-size: 1.25rem;
    background: var(--foreground);
    border: 0.07rem solid var(--border-color);
    border-radius: var(--border-radius);
  }
}
</style>
