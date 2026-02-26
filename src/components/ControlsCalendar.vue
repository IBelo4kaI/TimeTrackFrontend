<template>
  <div class="controls">
    <MonthControl v-model="store.currentDate" />
    <div
      class="controls-users"
      v-if="userStore.hasPermission('calendar.all', 'read')"
    >
      <SelectUI
        v-model="store.selectedUserId"
        :options="userStore.usersAll"
        value-key="id"
        :label-key="['name', 'surname']"
        placeholder="Выберите пользователя"
        @change="changeUser"
      />
    </div>
    <div class="controls-action" v-if="page == 'calendar'">
      <ButtonUI icon="fa-light fa-plus" @click="modalStore.open()">
        Добавить запись
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import MonthControl from '@/components/Calendar/MonthControl.vue'
import SelectUI from '@/components/SelectUI.vue'
import { useAddReportModalStore } from '@/stores/addReportModal'
import { useUserStore } from '@/stores/user'
import { onMounted } from 'vue'

const { page, store } = defineProps({
  page: { default: 'calendar' },
  store: { required: true },
})

const modalStore = useAddReportModalStore()

const userStore = useUserStore()

const changeUser = (value) => {
  // const user = userStore.usersAll.find((u) => u.id == value)
  // store.setUser(user)
}

onMounted(() => {
  userStore.userAllFetch()
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
</style>
