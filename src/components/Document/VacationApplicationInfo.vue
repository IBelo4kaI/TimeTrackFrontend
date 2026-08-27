<template>
  <div class="info" v-if="isLoading">
    <LoaderTitle />
  </div>

  <div class="info" v-else-if="!vacation">
    <span class="info__empty">Заявка не найдена</span>
  </div>

  <div class="info" v-else>
    <div class="info__header">
      <div class="info__employee">
        <div class="info__profile">{{ initials }}</div>
        <div class="info__employee-column">
          <div class="info__employee-name">{{ employeeName }}</div>
          <div class="info__employee-sub" v-if="employee?.department">
            {{ employee.department }}
          </div>
        </div>
      </div>
      <div class="info__badges">
        <Badge v-if="status" :type="status.type">{{ status.text }}</Badge>
        <Badge
          v-if="vacation.vacationTypeName"
          :style="typeBadgeStyle"
          type="muted"
        >
          {{ vacation.vacationTypeName }}
        </Badge>
      </div>
    </div>

    <div class="info__stats">
      <CardStatistics
        icon="fa-regular fa-calendar-range"
        iconVariant="primary"
        valueVariant="primary"
        label="Период отпуска"
        :value="period"
      />
      <CardStatistics
        icon="fa-regular fa-hourglass-half"
        iconVariant="warn"
        valueVariant="warn"
        label="Продолжительность"
        :value="formatStats(vacation.totalDays)"
      />
      <CardStatistics
        icon="fa-regular fa-scale-balanced"
        :iconVariant="vacation.vacationTypeAffectsBalance ? 'success' : 'primary'"
        :valueVariant="vacation.vacationTypeAffectsBalance ? 'success' : 'primary'"
        label="Списывается из нормы"
        :value="vacation.vacationTypeAffectsBalance ? 'Да' : 'Нет'"
      />
    </div>

    <div class="info__block" v-if="vacation.description">
      <div class="info__block-title">Комментарий</div>
      <div class="info__block-content">{{ vacation.description }}</div>
    </div>

    <div class="info__meta">
      <span v-if="createdAt">Создано: {{ createdAt.toLocaleString() }}</span>
      <span v-if="updatedAt">Обновлено: {{ updatedAt.toLocaleString() }}</span>
    </div>

    <div class="info__admin" v-if="canManage">
      <div class="info__admin-title">Управление заявкой</div>

      <div class="info__admin-actions">
        <ButtonUI
          v-if="vacation.status !== 'approved'"
          type="success"
          icon="fa-regular fa-octagon-check"
          :disabled="isMutating"
          @click="onApprove"
        >
          Утвердить
        </ButtonUI>
        <ButtonUI
          v-if="vacation.status !== 'pending'"
          type="warn"
          icon="fa-regular fa-clock"
          :disabled="isMutating"
          @click="onStatus('pending')"
        >
          На рассмотрении
        </ButtonUI>
        <ButtonUI
          v-if="vacation.status !== 'rejected'"
          type="destructive"
          icon="fa-regular fa-octagon-minus"
          :disabled="isMutating"
          @click="onStatus('rejected')"
        >
          Отклонить
        </ButtonUI>
      </div>

      <div class="info__admin-type">
        <span class="info__admin-type-label">Тип отпуска</span>
        <SelectUI
          :options="vacationTypes"
          value-key="id"
          label-key="name"
          :disabled="isMutating || vacationTypes.length === 0"
          v-model="selectedTypeId"
          @change="onTypeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Badge from '../Badge.vue'
import ButtonUI from '../ButtonUI.vue'
import LoaderTitle from '../Loader/LoaderTitle.vue'
import SelectUI from '../SelectUI.vue'
import CardStatistics from '../CardStatistics.vue'
import {
  approvedVacationStatus,
  updateVacationStatus,
  updateVacationType,
} from '@/services/vacation.api'
import { getVacationTypes } from '@/services/vacationTypes.api'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import { formatStats, getVacationStatusMeta } from '@/utils/vacation.utils'

const props = defineProps({
  vacation: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['changed'])

const userStore = useUserStore()
const notificationStore = useNotificationStore()

const canManage = computed(() =>
  userStore.hasPermission('vacation.all', 'edit')
)

const employee = computed(() =>
  props.vacation
    ? userStore.usersAll.find((u) => u.id === props.vacation.userId)
    : null
)

const employeeName = computed(() => {
  const e = employee.value
  if (!e) return 'Сотрудник не найден'
  return [e.surname, e.name, e.patronymic].filter(Boolean).join(' ')
})

const initials = computed(() => {
  const e = employee.value
  if (!e) return '?'
  return [e.surname?.[0], e.name?.[0]].filter(Boolean).join('').toUpperCase()
})

const status = computed(() =>
  props.vacation ? getVacationStatusMeta(props.vacation.status) : null
)

const period = computed(() => {
  if (!props.vacation) return ''
  const start = parseDate(props.vacation.startDate)
  const end = parseDate(props.vacation.endDate)
  return `${getDateNamed(start)} – ${getDateNamed(end)} ${end.getFullYear()}`
})

const typeBadgeStyle = computed(() => {
  const color = props.vacation?.vacationTypeColor
  if (!color) return {}
  return {
    color,
    borderColor: color,
    background: 'transparent',
  }
})

const createdAt = computed(() => {
  const c = props.vacation?.createdAt
  return c?.Valid ? new Date(c.Time) : null
})

const updatedAt = computed(() => {
  const u = props.vacation?.updatedAt
  return u?.Valid ? new Date(u.Time) : null
})

// vacationTypeId приходит с бэка как sql.NullString ({ String, Valid }), а не
// просто строкой (в отличие от name/color/affectsBalance — те COALESCE'ны).
const currentTypeId = computed(() => {
  const id = props.vacation?.vacationTypeId
  return id?.Valid ? id.String : null
})

// --- управление заявкой (для админа) ---

const vacationTypes = ref([])
const selectedTypeId = ref(null)
const isMutating = ref(false)

watch(
  currentTypeId,
  (id) => {
    selectedTypeId.value = id
  },
  { immediate: true }
)

watch(
  canManage,
  (v) => {
    if (v && vacationTypes.value.length === 0) loadVacationTypes()
  },
  { immediate: true }
)

async function loadVacationTypes() {
  try {
    vacationTypes.value = (await getVacationTypes()) ?? []
  } catch {
    vacationTypes.value = []
  }
}

async function onApprove() {
  await runMutation(
    () => approvedVacationStatus(props.vacation.id, employeeName.value),
    'Отпуск утверждён',
    'Ошибка при утверждении отпуска'
  )
}

async function onStatus(newStatus) {
  await runMutation(
    () => updateVacationStatus(props.vacation.id, newStatus, employeeName.value),
    'Статус обновлён',
    'Ошибка при обновлении статуса'
  )
}

async function onTypeChange(newTypeId) {
  if (!newTypeId || newTypeId === currentTypeId.value) return

  await runMutation(
    () => updateVacationType(props.vacation.id, newTypeId),
    'Тип отпуска обновлён',
    'Ошибка при обновлении типа отпуска',
    () => {
      selectedTypeId.value = currentTypeId.value // откат селекта при ошибке
    }
  )
}

async function runMutation(action, successMessage, errorMessage, onError) {
  isMutating.value = true
  try {
    await action()
    notificationStore.addNotification(successMessage, 'success')
    emit('changed')
  } catch {
    notificationStore.addNotification(errorMessage, 'error')
    onError?.()
  } finally {
    isMutating.value = false
  }
}
</script>

<style scoped>
.info {
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  padding: var(--padding-secondary);
}

.info__empty {
  color: var(--muted-text);
}

.info__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--gap-primary);
  padding-bottom: var(--padding-secondary);
  border-bottom: 0.07rem solid var(--border-color);
}

.info__employee {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info__profile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 700;
  flex-shrink: 0;
}

.info__employee-column {
  display: flex;
  flex-direction: column;
}

.info__employee-name {
  font-size: 1.2rem;
  font-weight: 700;
}

.info__employee-sub {
  color: var(--muted-text);
  font-size: 0.9rem;
}

.info__badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.info__stats {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
  flex-wrap: wrap;
}

.info__stats > * {
  flex: 1;
  min-width: 14rem;
}

.info__block-title {
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 700;
  margin-bottom: 0.36rem;
}

.info__block-content {
  white-space: pre-wrap;
}

.info__meta {
  display: flex;
  gap: var(--gap-primary);
  flex-wrap: wrap;
  color: var(--muted-text);
  font-size: 0.85rem;
}

.info__admin {
  display: flex;
  flex-direction: column;
  gap: var(--padding-secondary);
  padding-top: var(--padding-secondary);
  border-top: 0.07rem solid var(--border-color);
}

.info__admin-title {
  font-size: 0.9rem;
  color: var(--muted-text);
  font-weight: 700;
}

.info__admin-actions {
  display: flex;
  gap: var(--gap-primary);
  flex-wrap: wrap;
}

.info__admin-type {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.info__admin-type-label {
  color: var(--muted-text);
  font-size: 0.9rem;
  font-weight: 500;
}
</style>
