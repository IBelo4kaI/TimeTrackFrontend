<template>
  <div class="worker-home">
    <div class="profile-card">
      <div class="profile-main">
        <div class="profile-avatar">{{ workerStore.initials }}</div>
        <div class="profile-info">
          <div class="profile-name">{{ workerStore.fullName }}</div>
          <div class="profile-meta" v-if="directory">
            {{ directory.position }}
            <template v-if="directory.department">
              · {{ directory.department }}
            </template>
          </div>
        </div>
      </div>
      <Badge :type="workerStore.todayStatus.badge">
        {{ workerStore.todayStatus.label }}
      </Badge>
    </div>

    <div class="stat-grid">
      <CardStatistics
        icon="fa-regular fa-clock"
        icon-variant="primary"
        :value="`${workerStore.monthStats.hours.totalHours}/${workerStore.monthStats.hours.standardHours} ч`"
        label="Часы в этом месяце"
        :progress="hoursProgress"
      />
      <CardStatistics
        icon="fa-regular fa-calendar-days"
        icon-variant="success"
        :value="`${workerStore.monthStats.workDays.totalWorkDays}/${workerStore.monthStats.workDays.standardWorkDays} д`"
        label="Рабочих дней в этом месяце"
        :progress="daysProgress"
        progress-variant="success"
      />
      <CardStatistics
        icon="fa-regular fa-tree-palm"
        icon-variant="warn"
        label="Отпуск"
        :rows="vacationRows"
      />
      <CardStatistics
        icon="fa-regular fa-notes-medical"
        icon-variant="destructive"
        :value="formatStats(workerStore.sickDaysThisYear)"
        label="Больничные в этом году"
      />
    </div>

    <div class="secondary-grid">
      <div class="card">
        <div class="card-title">Ближайший отпуск</div>
        <template v-if="workerStore.nextVacation">
          <div class="next-dates">
            {{ getDateNamed(new Date(workerStore.nextVacation.startDate)) }}
            —
            {{ getDateNamed(new Date(workerStore.nextVacation.endDate)) }}
          </div>
          <div class="next-meta">
            {{ formatStats(workerStore.nextVacation.totalDays) }}
            <template v-if="workerStore.nextVacation.vacationTypeName">
              · {{ workerStore.nextVacation.vacationTypeName }}
            </template>
          </div>
        </template>
        <div v-else class="empty-text">Отпусков не запланировано</div>
      </div>

      <div class="card">
        <div class="card-title">Последние заявки</div>
        <div v-if="!workerStore.recentRequests.length" class="empty-text">
          Заявок нет
        </div>
        <ul v-else class="requests-list">
          <li v-for="item in workerStore.recentRequests" :key="`${item.kind}-${item.id}`">
            <component
              :is="item.kind === 'vacation' ? 'RouterLink' : 'div'"
              v-bind="
                item.kind === 'vacation'
                  ? { to: { name: 'vacation-application', params: { id: item.id } } }
                  : {}
              "
              class="request-row"
              :class="{ 'request-row--link': item.kind === 'vacation' }"
            >
              <i
                :class="
                  item.kind === 'vacation'
                    ? 'fa-regular fa-tree-palm'
                    : 'fa-regular fa-notes-medical'
                "
              ></i>
              <span class="request-dates">
                {{ getDateNamed(new Date(item.startDate)) }}
                —
                {{ getDateNamed(new Date(item.endDate)) }}
              </span>
              <Badge
                v-if="item.kind === 'vacation'"
                :type="getVacationStatusMeta(item.status)?.type ?? 'muted'"
              >
                {{ getVacationStatusMeta(item.status)?.text ?? item.status }}
              </Badge>
              <Badge v-else :type="item.status === 'official' ? 'success' : 'muted'">
                {{ item.status === 'official' ? 'Официальный' : 'Неофициальный' }}
              </Badge>
            </component>
          </li>
        </ul>
      </div>

      <!-- Привязка VK — личная настройка, есть смысл только на своей
      странице, не в карточке другого сотрудника. -->
      <VKLinkCard v-if="isSelf" />
    </div>
  </div>
</template>

<script setup>
import Badge from '@/components/Badge.vue'
import CardStatistics from '@/components/CardStatistics.vue'
import { useWorkerStore } from '@/stores/worker'
import { getDateNamed } from '@/utils/calendar.utils'
import { formatStats, getVacationStatusMeta } from '@/utils/vacation.utils'
import { computed } from 'vue'
import VKLinkCard from './VKLinkCard.vue'

defineProps({
  isSelf: { type: Boolean, default: false },
})

const workerStore = useWorkerStore()

const directory = computed(() => workerStore.directoryEntry)

// Тот же safe-percent, что и в pages/report/Index.vue, но с защитой от
// деления на 0 (норма часов/дней может быть не задана для месяца).
const percent = (num, all) => (all > 0 ? Math.abs((num / all) * 100) : 0)

const hoursProgress = computed(() =>
  percent(workerStore.monthStats.hours.totalHours, workerStore.monthStats.hours.standardHours)
)

const daysProgress = computed(() =>
  percent(
    workerStore.monthStats.workDays.totalWorkDays,
    workerStore.monthStats.workDays.standardWorkDays
  )
)

const vacationRows = computed(() => [
  {
    label: 'Использовано',
    value: formatStats(workerStore.vacationStats.used),
    valueVariant: 'warn',
  },
  {
    label: 'Осталось',
    value: formatStats(workerStore.vacationStats.free),
    valueVariant: 'success',
  },
  {
    label: 'Ожидает',
    value: formatStats(workerStore.vacationStats.pending),
    valueVariant: 'primary',
  },
])
</script>

<style scoped>
.worker-home {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
}

.profile-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-primary);
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 0.86rem;
  min-width: 0;
}

.profile-avatar {
  flex-shrink: 0;
  width: 3.43rem;
  height: 3.43rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.14rem;
  font-weight: 700;
}

.profile-info {
  min-width: 0;
}

.profile-name {
  font-size: 1.14rem;
  font-weight: 700;
  color: var(--text);
}

.profile-meta {
  font-size: 0.93rem;
  color: var(--muted-text);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14.29rem, 1fr));
  gap: calc(var(--padding-secondary) / 2);
}

.secondary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: calc(var(--padding-secondary) / 2);
}

.card {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.next-dates {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
}

.next-meta {
  font-size: 0.9rem;
  color: var(--muted-text);
}

.empty-text {
  font-size: 0.93rem;
  color: var(--muted-text);
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
}

.request-row {
  display: flex;
  align-items: center;
  gap: 0.71rem;
  padding: 0.57rem 0.71rem;
  border-radius: calc(var(--border-radius) * 0.7);
  background: var(--muted-foreground);
  color: var(--text);
}

.request-row--link {
  cursor: pointer;
  transition: background 0.15s ease;
}

.request-row--link:hover {
  background: var(--muted-accent);
  color: var(--accent);
}

.request-dates {
  flex: 1;
  font-size: 0.93rem;
  min-width: 0;
}
</style>
