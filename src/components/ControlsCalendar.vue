<template>
  <div class="controls" :class="{ 'calendar-controls': isCalendarControl }">
    <MonthControl v-model="store.currentDate" @change="changeUser" />
    <div
      class="controls-users"
      v-if="
        isShowSelectingUser && (isCalendarControl ? store.canSelectEmployees : userStore.hasPermission('calendar.all', 'read'))
      "
    >
      <Autocomplete
        v-model="store.selectedUserId"
        :options="isCalendarControl ? store.employeeOptions : userStore.usersAll"
        value-key="id"
        :label-key="['name', 'surname']"
        label-separator=" "
        placeholder="Выберите пользователя"
        :is-show-button="false"
        @select="selectUser"
        @clear="clearUser"
      />
    </div>
    <ButtonUI v-if="isCalendarControl && store.selectedUserId !== userStore.user?.id"
      type="muted" icon="fa-regular fa-user" @click="openOwnCalendar">Мой календарь</ButtonUI>
    <span v-if="isCalendarControl && store.employeesError" class="employees-error" role="status">
      {{ store.employeesError }}
      <button type="button" :disabled="store.isLoading" @click="changeUser">Повторить</button>
    </span>
    <div class="controls-action">
      <ButtonUI
        v-if="page == 'calendar'"
        icon="fa-light fa-plus"
        @click="modalStore.open()"
      >
        {{ selectingStore.selectedCount > 1 ? `Редактировать выбранные (${selectingStore.selectedCount})` : 'Добавить запись' }}
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import MonthControl from '@/components/Calendar/MonthControl.vue'
import { useAddReportModalStore } from '@/stores/addReportModal'
import { useSelectingStore } from '@/stores/selecting'
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
const selectingStore = useSelectingStore()

const userStore = useUserStore()

const changeUser = async () => {
  await store.initialFetch()
}

const selectUser = async (option) => {
  store.selectedUser = userStore.usersAll.find((user) => user.id === store.selectedUserId) || option
  await changeUser()
}
const openOwnCalendar = async () => {
  store.selectedUserId = userStore.user?.id
  store.selectedUser = userStore.user
  await changeUser()
}
const clearUser = async () => {
  if (isCalendarControl.value && !userStore.hasPermission('calendar.all', 'read')) return openOwnCalendar()
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

.employees-error { color: var(--muted-text); font-size: .85rem; }
.employees-error button { color: var(--accent); text-decoration: underline; cursor: pointer; }

.calendar-controls {
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 768px) {
  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  }
  .controls-action {
    display: none;
  }
}
</style>
