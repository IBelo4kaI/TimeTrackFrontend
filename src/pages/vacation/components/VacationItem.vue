<template>
  <div class="vacation-item" :class="{ 'vacation-item-with-user': isAdmin }">
    <div class="vacation-item-user" v-if="isAdmin && user">
      {{ user.surname }} {{ user.name }}
    </div>
    <div class="vacation-item-status">
      <Badge :type="statusC.type">{{ statusC.text }}</Badge>
    </div>
    <div class="vacation-item-total">{{ formatStats(item.totalDays) }}</div>
    <div class="vacation-item-dates">
      {{ getDateNamed(parseDate(item.startDate)) }} -
      {{ getDateNamed(parseDate(item.endDate)) }}
      {{ parseDate(item.endDate).getFullYear() }}
    </div>
    <div class="vacation-item-desc">
      {{ item.description }}
    </div>
    <div class="vacation-item-createAt">
      Создано
      <br />
      {{ parseDate(item.createdAt.Time).toLocaleDateString() }}
    </div>
    <div class="vacation-item-actions">
      <!-- <ButtonUI type="muted-accent">Подробнее</ButtonUI> -->
      <template
        v-if="isAdmin && userStore.hasPermission('vacation.all', 'edit')"
      >
        <ButtonUI
          type="success"
          @click="onApproved"
          v-if="item.status == 'pending'"
        >
          Утвердить
        </ButtonUI>
        <ButtonUI
          type="destructive"
          @click="onStatus('rejected')"
          v-if="item.status != 'rejected'"
        >
          Отклонить
        </ButtonUI>
      </template>
      <template v-else>
        <ButtonUI
          type="destructive"
          v-if="item.status != 'approved'"
          @click="
            confirmModalStore.open(
              onDeleted,
              'Вы действительно хотите удалить?'
            )
          "
        >
          Удалить
        </ButtonUI>
      </template>
    </div>
    <!-- <div class="vacation-detailed"></div> -->
  </div>
</template>

<script setup>
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import {
  approvedVacationStatus,
  deleteVacation,
  updateVacationStatus,
} from '@/services/vacation.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { useVacationStore } from '@/stores/vacation'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { formatStats } from '@/utils/vacation.utils'
import { computed } from 'vue'

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()
const vacationStore = useVacationStore()

const { item, isAdmin } = defineProps(['item', 'isAdmin'])

const user = computed(() => {
  if (isAdmin && userStore.usersAll)
    return userStore.usersAll.find((u) => u.id == item.userId)
  else return null
})

const onApproved = async () => {
  const resp = await approvedVacationStatus(item.id)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const onDeleted = async () => {
  const resp = await deleteVacation(item.id)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const onStatus = async (status) => {
  const resp = await updateVacationStatus(item.id, status)
  notificationStore.addNotification(resp.message, 'success')
  await vacationStore.fetchVacations()
}

const statusC = computed(() =>
  item.status == 'approved'
    ? { text: 'Утверждена', type: 'success' }
    : item.status == 'pending'
      ? { type: 'warn', text: 'На рассмотрении' }
      : { type: 'destruct', text: 'Отклонена' }
)
</script>

<style scoped>
.vacation-item {
  display: grid;
  grid-template-areas:
    'status total actions createAt'
    'dates dates actions createAt'
    'desc desc actions createAt';
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}
.vacation-item-with-user {
  grid-template-areas:
    'user user actions createAt'
    'status total actions createAt'
    'dates dates actions createAt'
    'desc desc actions createAt';
}
.vacation-item-user {
  grid-area: user;
  font-weight: 600;
  font-size: 1.2rem;
}
.vacation-item-status {
  grid-area: status;
}
.vacation-item-total {
  grid-area: total;
  color: var(--muted-text);
  font-weight: 600;
}
.vacation-item-dates {
  grid-area: dates;
  font-weight: 600;
  font-size: 1.2rem;
}
.vacation-item-desc {
  grid-area: desc;
  color: var(--muted-text);
}
.vacation-item-createAt {
  grid-area: createAt;
}
.vacation-item-actions {
  grid-area: actions;
  display: flex;
  flex-wrap: wrap;
  gap: 0.71rem;
}
</style>
