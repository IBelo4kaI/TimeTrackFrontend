<template>
  <div class="controls" :class="{ 'controls-with-status': isCalendarControl }">
    <MonthControl v-model="store.currentDate" @change="changeUser" />
    <CalendarTimesheetStatus v-if="isCalendarControl" :calendar="store" class="controls-status" />
    <div
      class="controls-users"
      v-if="
        isShowSelectingUser && userStore.hasPermission('calendar.all', 'read')
      "
    >
      <Autocomplete
        v-model="store.selectedUserId"
        :options="userStore.usersAll"
        value-key="id"
        :label-key="['name', 'surname']"
        label-separator=" "
        placeholder="Выберите пользователя"
        :is-show-button="false"
        @select="changeUser"
        @clear="clearUser"
      />
    </div>
    <div class="controls-action">
      <ButtonUI
        v-if="page == 'calendar'"
        icon="fa-light fa-plus"
        @click="modalStore.open()"
      >
        Добавить запись
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import CalendarTimesheetStatus from '@/components/Calendar/CalendarTimesheetStatus.vue'
import MonthControl from '@/components/Calendar/MonthControl.vue'
import { useAddReportModalStore } from '@/stores/addReportModal'
import { useUserStore } from '@/stores/user'
import { computed, onMounted } from 'vue'
import Autocomplete from './Autocomplete.vue'

const { page, store } = defineProps({
  page: { default: 'calendar' },
  store: { required: true },
  isShowSelectingUser: { type: Boolean, default: true },
})

const isCalendarControl = computed(() => page === 'calendar' || page === 'calendar-mobile')

const modalStore = useAddReportModalStore()

const userStore = useUserStore()

const changeUser = async () => {
  await store.initialFetch()
}

const clearUser = async () => {
  store.selectedUserId = null
  store.selectedUser = null
  await store.initialFetch()
}

onMounted(() => {
  if (page !== 'report' && !userStore.usersAll.length) userStore.userAllFetch()
})
</script>

<style scoped>
.controls {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  /* padding: var(--padding-secondary);
  border-radius: var(--border-radius);
  background: var(--foreground); */
}

.controls-with-status {
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 768px) {
  .controls-status {
    grid-column: 1 / -1;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  }
  .controls-action {
    display: none;
  }
}
</style>
