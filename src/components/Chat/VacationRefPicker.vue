<template>
  <div class="vacation-ref-picker">
    <Autocomplete
      v-if="!modelValue"
      v-model="pickerValue"
      :options="options"
      label-key="label"
      value-key="entityId"
      placeholder="Найти заявку на отпуск..."
      :is-show-button="false"
      :loading="isLoading"
      empty-text="Заявок не найдено"
      @select="onSelect"
    />

    <div v-else class="vacation-ref-picker__selected">
      <i class="fa-regular fa-plane-departure"></i>
      <div class="vacation-ref-picker__info">
        <span class="vacation-ref-picker__title">{{ modelValue.entityTitle }}</span>
        <span class="vacation-ref-picker__subtitle">{{ modelValue.entitySubtitle }}</span>
      </div>
      <button type="button" class="vacation-ref-picker__remove" @click="modelValue = null">
        <i class="fa-regular fa-xmark"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import Autocomplete from '@/components/Autocomplete.vue'
import { getAllUserVacationsByYear, getVacationsByYear } from '@/services/vacation.api'
import { useUserStore } from '@/stores/user'
import { getVacationStatusMeta } from '@/utils/vacation.utils'
import { computed, onMounted, ref } from 'vue'

// modelValue — либо null, либо { entityType: 'vacation', entityId, entityTitle, entitySubtitle }.
const modelValue = defineModel({ default: null })

const userStore = useUserStore()
const pickerValue = ref('')
const isLoading = ref(false)
const vacations = ref([])

// Показать список заявок ВСЕХ сотрудников, а не только своих, можно только
// если есть оба разрешения: vacation.all:read (иначе сам список чужих
// заявок не загрузить — GET /vacation/all/:year) И vacation.all:link
// (иначе бэк всё равно отклонит попытку сослаться на чужую заявку в
// сообщении, см. internal/chat/handler.go checkEntityRefAccess) — без
// второго показывать чужие заявки в пикере бессмысленно, они всё равно не
// отправятся.
const canViewAll = computed(
  () => userStore.hasPermission('vacation.all', 'read') && userStore.hasPermission('vacation.all', 'link')
)

function employeeName(userId) {
  const u = userStore.usersAll.find((x) => x.id === userId)
  return u ? [u.surname, u.name].filter(Boolean).join(' ') : null
}

function formatRange(startDate, endDate) {
  const fmt = (d) => new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${fmt(startDate)}–${fmt(endDate)}`
}

const options = computed(() =>
  vacations.value.map((v) => {
    const range = formatRange(v.startDate, v.endDate)
    const status = getVacationStatusMeta(v.status)?.text ?? v.status
    const name = canViewAll.value ? employeeName(v.userId) : null

    return {
      entityId: v.id,
      entityType: 'vacation',
      entityTitle: 'Заявка на отпуск',
      entitySubtitle: [name, range, status].filter(Boolean).join(' · '),
      label: [name, range, status].filter(Boolean).join(' · '),
    }
  })
)

function onSelect(option) {
  modelValue.value = {
    entityType: option.entityType,
    entityId: option.entityId,
    entityTitle: option.entityTitle,
    entitySubtitle: option.entitySubtitle,
  }
  pickerValue.value = ''
}

onMounted(async () => {
  isLoading.value = true
  try {
    const year = new Date().getFullYear()
    vacations.value = canViewAll.value
      ? ((await getAllUserVacationsByYear(year)) ?? [])
      : ((await getVacationsByYear(year, userStore.user?.id)) ?? [])
  } catch {
    vacations.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.vacation-ref-picker {
  display: flex;
  flex-direction: column;
}

.vacation-ref-picker__selected {
  display: flex;
  align-items: center;
  gap: 0.71rem;
  padding: 0.57rem 0.86rem;
  background: var(--muted-foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.vacation-ref-picker__selected i {
  font-size: 1.14rem;
  color: var(--accent);
  flex-shrink: 0;
}

.vacation-ref-picker__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.vacation-ref-picker__title {
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
}

.vacation-ref-picker__subtitle {
  font-size: 0.79rem;
  color: var(--muted-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vacation-ref-picker__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.57rem;
  height: 1.57rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--muted-text);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.vacation-ref-picker__remove:hover {
  background: var(--background);
  color: var(--destructive);
}
</style>
