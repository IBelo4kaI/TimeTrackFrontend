<template>
  <div class="reminder-card">
    <div class="reminder-card__title">Напоминания о заполнении табеля</div>
    <div class="reminder-card__hint">
      Автоматически шлётся раз в сутки: мягкое напоминание в последние дни текущего месяца,
      настойчивое — в первые дни следующего, про уже закрытый. Кнопка ниже запускает ту же
      проверку прямо сейчас, не дожидаясь расписания.
    </div>
    <ButtonUI :disabled="isRunning" @click="onRun">
      <template v-if="isRunning"><LoaderTitle text="Проверка" /></template>
      <template v-else>Проверить сейчас</template>
    </ButtonUI>

    <AppTable v-if="hasRun" :headers="headers" :rows="rows" row-key="key">
      <template #cell-notified="{ value }">
        <Badge :type="value ? 'success' : 'muted'">
          {{ value ? 'Отправлено' : 'Уже отправлено сегодня' }}
        </Badge>
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { runTimesheetReminderCheck } from '@/services/timesheetReminder.api'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { computed, ref } from 'vue'

const notificationStore = useNotificationStore()
const userStore = useUserStore()

const isRunning = ref(false)
const hasRun = ref(false)
const results = ref([])

const MONTH_NAMES = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

const headers = [
  { valueKey: 'name', title: 'Сотрудник' },
  { valueKey: 'period', title: 'Период' },
  { valueKey: 'gaps', title: 'Пропусков', align: 'right' },
  { valueKey: 'notified', title: 'Статус' },
]

function userName(userId) {
  const user = userStore.usersAll.find((u) => u.id === userId)
  if (!user) return userId
  return [user.surname, user.name, user.patronymic].filter(Boolean).join(' ')
}

const rows = computed(() =>
  results.value.map((r) => ({
    key: `${r.userId}:${r.kind}:${r.year}-${r.month}`,
    name: userName(r.userId),
    period: `${MONTH_NAMES[r.month - 1]} ${r.year}${r.kind === 'soft' ? ' (текущий)' : ' (прошлый)'}`,
    gaps: r.gaps,
    notified: r.notified,
  }))
)

async function onRun() {
  isRunning.value = true
  try {
    const result = await runTimesheetReminderCheck()
    results.value = result?.results ?? []
    hasRun.value = true

    const sent = result?.sent ?? 0
    notificationStore.addNotification(
      results.value.length > 0
        ? `Проверка выполнена: незаполненных табелей — ${results.value.length}, отправлено уведомлений — ${sent}`
        : 'Проверка выполнена: незаполненных табелей не найдено',
      'success'
    )
  } catch {
    notificationStore.addNotification('Не удалось запустить проверку', 'error')
  } finally {
    isRunning.value = false
  }
}
</script>

<style scoped>
.reminder-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.71rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.reminder-card > :deep(.table-wrapper) {
  width: 100%;
}

.reminder-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.reminder-card__hint {
  font-size: 0.86rem;
  color: var(--muted-text);
}
</style>
