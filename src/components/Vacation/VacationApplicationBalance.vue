<template>
  <section class="balance" aria-labelledby="vacation-balance-title">
    <header class="balance-header">
      <h2 id="vacation-balance-title">Баланс отпуска</h2>
      <span class="balance-caption">{{ affectsBalance ? 'Списывается из ежегодного отпуска' : 'Не списывается из ежегодного отпуска' }}</span>
    </header>

    <dl class="balance-values">
      <div>
        <dt>Остаток на {{ startLabel }}</dt>
        <dd class="available">{{ availableDays == null ? '—' : `${availableDays} дн.` }}</dd>
      </div>
      <div>
        <dt>Эта заявка</dt>
        <dd>{{ totalDays }} дн.</dd>
      </div>
      <div>
        <dt>Превышение</dt>
        <dd :class="{ excess: excessDays > 0 }">{{ excessDays }} дн.</dd>
      </div>
    </dl>

    <template v-if="affectsBalance && availableDays != null && totalDays > 0">
      <div class="balance-track" role="img" :aria-label="`${withinDays} дн. в пределах остатка, ${excessDays} дн. сверх лимита`">
        <div v-if="withinDays > 0" class="balance-within" :style="{ flex: withinDays }"></div>
        <div v-if="excessDays > 0" class="balance-excess" :style="{ flex: excessDays }"></div>
      </div>
      <div class="balance-legend">
        <span>{{ withinDays }} дн. в пределах остатка</span>
        <span v-if="excessDays > 0">{{ excessDays }} дн. сверх лимита</span>
      </div>
    </template>
    <p v-if="availableDays == null" class="balance-note">Для этой заявки остаток на момент подачи не сохранён.</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { parseLocalDate } from '@/components/Vacation/VacationOther/VacationTable/vacationUtils'

const props = defineProps({ vacation: { type: Object, required: true } })
const affectsBalance = computed(() => props.vacation.vacationTypeAffectsBalance !== false)
const availableDays = computed(() => {
  const value = props.vacation.availableDays
  if (typeof value === 'number') return Math.max(0, value)
  return value?.Valid ? Math.max(0, Number(value.Int32)) : null
})
const totalDays = computed(() => Math.max(0, Number(props.vacation.totalDays) || 0))
// Превышение зафиксировано сервером при подаче/редактировании заявки.
const excessDays = computed(() => affectsBalance.value
  ? Math.min(totalDays.value, Math.max(0, Number(props.vacation.excessDays) || 0))
  : 0
)
const withinDays = computed(() => totalDays.value - excessDays.value)
const startLabel = computed(() => props.vacation.startDate
  ? parseLocalDate(props.vacation.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  : 'дату начала'
)
</script>

<style scoped>
.balance {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  container-type: inline-size;
}
.balance-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: var(--gap-primary); margin-bottom: 1.25rem; }
h2 { margin: 0; font-size: 1.1rem; }
.balance-caption { color: var(--muted-text); font-size: .85rem; }
.balance-values { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--padding-secondary); margin: 0 0 1.25rem; }
dt { color: var(--muted-text); font-size: .9rem; font-weight: 600; }
dd { margin: .35rem 0 0; font-size: 1.8rem; font-weight: 700; line-height: 1.2; }
.available { color: var(--success); }
.excess { color: var(--warn); }
.balance-track { display: flex; height: .85rem; border-radius: 1rem; overflow: hidden; background: var(--muted-foreground); }
.balance-within { background: var(--success); min-width: 0; }
.balance-excess { background: repeating-linear-gradient(135deg, var(--warn) 0, var(--warn) .45rem, var(--muted-warn) .45rem, var(--muted-warn) .9rem); min-width: 0; }
.balance-legend { display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--gap-secondary); margin-top: .55rem; color: var(--muted-text); font-size: .85rem; font-weight: 600; }
.balance-note { margin: .75rem 0 0; color: var(--muted-text); font-size: .85rem; }
@container (max-width: 28rem) {
  .balance-values { gap: var(--gap-primary); }
  dd { font-size: 1.4rem; }
  dt { font-size: .8rem; }
}
@container (max-width: 20rem) {
  .balance-values { grid-template-columns: 1fr; }
}
</style>
