<template>
  <div class="application-page">
    <header class="application-header">
      <div>
        <RouterLink :to="{ name: 'vacation' }" class="back-link"><i class="fa-regular fa-arrow-left" aria-hidden="true"></i> Назад</RouterLink>
        <h1>Заявка на отпуск</h1>
        <p class="muted">Создана {{ displayTimestamp(vacation?.createdAt) }}</p>
      </div>
      <ButtonUI v-if="vacation" type="accent" icon="fa-regular fa-file-arrow-down" :disabled="downloading" @click="downloadApplication">{{ downloading ? 'Подготовка…' : 'Скачать заявление' }}</ButtonUI>
    </header>

    <div v-if="loading" class="panel state" role="status">Загрузка заявки…</div>
    <div v-else-if="loadError" class="panel state" role="alert"><p>{{ loadError }}</p><ButtonUI @click="load">Повторить</ButtonUI></div>
    <template v-else-if="vacation">
      <div class="application-columns">
        <main class="main-column">
          <section class="panel request-summary" aria-label="Данные заявки на отпуск">
            <div class="summary-header">
              <div class="employee">
                <div class="avatar" aria-hidden="true">{{ initials }}</div>
                <div class="employee-details">
                  <h2 class="employee-name">{{ nameFor(vacation.userId) }}</h2>
                  <p class="muted">{{ employee?.position || 'Сотрудник' }}<template v-if="employee?.department"> · {{ employee.department }}</template></p>
                </div>
              </div>
              <div class="summary-badges">
                <Badge :type="status?.type">{{ status?.text }}</Badge>
                <VacationExcessBadge :days="vacation.excessDays" />
              </div>
            </div>
            <dl class="facts">
              <div class="fact-card">
                <dt>Период</dt>
                <dd class="period-value">{{ periodText }}</dd>
              </div>
              <div class="fact-card">
                <dt>Продолжительность</dt>
                <dd>{{ formatStats(vacation.totalDays) }}</dd>
              </div>
              <div class="fact-card">
                <dt><label for="vacation-type">Тип отпуска</label></dt>
                <dd>
                  <select id="vacation-type" class="field type-select" :value="typeId" :disabled="!canEdit || busy || editing || relatedLoading" @change="onTypeChange">
                    <option v-if="!types.some(t => t.id === typeId)" :value="typeId">{{ vacation.vacationTypeName || 'Тип не указан' }}</option>
                    <option v-for="type in types" :key="type.id" :value="type.id">{{ type.name }}</option>
                  </select>
                </dd>
              </div>
            </dl>
            <div v-if="vacation.decisionComment" class="fact-card decision-comment">
              <h3>Комментарий к решению</h3>
              <p class="decision-result">{{ vacation.decisionComment }}</p>
            </div>
            <p v-if="vacation.description" class="description">{{ vacation.description }}</p>
            <section v-if="editing" ref="editPanel" class="edit-form" aria-label="Редактирование заявки" @keydown.ctrl.enter.prevent="saveEdit">
              <h3>Редактирование заявки</h3>
              <div class="edit-period"><label>Дата начала<input v-model="draft.startDate" class="field" type="date" required /></label><label>Дата окончания<input v-model="draft.endDate" class="field" type="date" required :min="draft.startDate" /></label></div>
              <label>Тип отпуска<select v-model="draft.vacationTypeId" class="field" required><option v-for="type in types" :key="type.id" :value="type.id">{{ type.name }}</option></select></label>
              <label>Комментарий<textarea v-model="draft.description" class="field" rows="3"></textarea></label>
              <p v-if="draftDays != null">Продолжительность: {{ formatStats(draftDays) }}</p>
              <p v-if="draftExcess > 0" class="warning-text" role="status">Превышение доступного остатка: {{ formatStats(draftExcess) }}. Заявку можно сохранить.</p>
              <p v-if="editError" class="error" role="alert">{{ editError }}</p>
              <div class="actions"><ButtonUI type="accent" :disabled="busy" @click="saveEdit">Сохранить изменения</ButtonUI><ButtonUI :disabled="busy" @click="editing = false">Отмена</ButtonUI></div>
            </section>
          </section>

          <VacationApplicationBalance :vacation="vacation" />

          <section class="decision-panel" aria-label="Решение по заявке">
            <template v-if="pending && isManager">
              <div class="decision-comment decision-comment-input">
                <label for="decision-comment">Комментарий к решению <span class="muted">(необязательно)</span></label>
                <textarea id="decision-comment" v-model="comment" class="field" rows="2" maxlength="4000" :disabled="busy || editing"></textarea>
              </div>
              <div class="actions"><ButtonUI type="success" :disabled="busy || editing" @click="decide('approved')">Утвердить</ButtonUI><ButtonUI type="destructive" :disabled="busy || editing" @click="decide('rejected')">Отклонить</ButtonUI></div>
            </template>
            <template v-else-if="pending">
              <strong>Ожидает решения руководителя</strong>
              <div v-if="canEdit" class="actions"><ButtonUI type="accent" :disabled="busy || editing" @click="startEdit">Редактировать</ButtonUI><ButtonUI type="destructive" :disabled="busy" @click="confirmWithdrawal">Отозвать заявку</ButtonUI></div>
            </template>
            <template v-else>
              <Badge :type="status?.type">{{ status?.text }}</Badge>
              <ButtonUI v-if="isManager" type="accent" :disabled="busy" @click="decide('pending')">Вернуть на рассмотрение</ButtonUI>
            </template>
          </section>
        </main>

        <aside class="additional-column">
          <VacationApplicationFiles :key="vacation.id" :vacation-id="vacation.id" :vacation="vacation" @changed="load" />
          <section class="panel history-panel">
            <h2>История</h2>
            <p v-if="relatedLoading" class="muted" role="status">Загрузка истории…</p>
            <div v-else-if="historyError" role="alert"><p>Не удалось загрузить историю.</p><ButtonUI @click="load">Повторить</ButtonUI></div>
            <ol v-else-if="history.length" class="history"><li v-for="event in history" :key="event.id"><span class="history-dot"></span><p>{{ event.detail }}</p><small>{{ nameFor(event.actorId) }} · {{ event.createdAt ? displayTimestamp(event.createdAt) : 'Время не сохранено' }}</small></li></ol>
            <p v-else class="muted">История событий пока пуста.</p>
          </section>
        </aside>
      </div>


    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Badge from '@/components/Badge.vue'
import VacationExcessBadge from '@/components/Vacation/VacationExcessBadge.vue'
import VacationApplicationBalance from '@/components/Vacation/VacationApplicationBalance.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import VacationApplicationFiles from '@/components/Document/VacationApplicationFiles.vue'
import { useVacationApplication, displayTimestamp } from '@/helpers/useVacationApplication'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useSubmenuStore } from '@/stores/submenu'
import { useVacationDocs } from '@/stores/vacationDocs'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { formatStats } from '@/utils/vacation.utils'
import { parseLocalDate } from '@/components/Vacation/VacationOther/VacationTable/vacationUtils'

useHeaderTitleStore().setTitle('Заявка на отпуск', 'Рассмотрение и документы')
useSubmenuStore().reset()
const { vacation, loading, busy, loadError, relatedLoading, types, history, historyError, employee, nameFor, status, isManager, pending, canEdit, comment, editing, draft, draftDays, draftFreeDays, editError, load, decide, startEdit, saveEdit, changeType, withdraw } = useVacationApplication()
const editPanel = ref(null)
watch(editing, async (enabled) => {
  if (!enabled) return
  await nextTick()
  editPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  editPanel.value?.querySelector('input')?.focus({ preventScroll: true })
})
const typeId = computed(() => vacation.value?.vacationTypeId?.String ?? '')
const periodText = computed(() => {
  if (!vacation.value) return ''
  const start = parseLocalDate(vacation.value.startDate)
  const end = parseLocalDate(vacation.value.endDate)
  const format = (date, year = true) => date.toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}),
  }).replace(/\s*г\.$/, '')
  const sameYear = start.getFullYear() === end.getFullYear()
  if (sameYear && start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${format(end)}`
  }
  return `${format(start, !sameYear)} – ${format(end)}`
})
const initials = computed(() => nameFor(vacation.value?.userId).split(' ').slice(0, 2).map((part) => part[0]).join(''))
const draftExcess = computed(() => types.value.find((type) => type.id === draft.vacationTypeId)?.affectsBalance && draftFreeDays.value != null && draftDays.value != null ? Math.max(0, draftDays.value - draftFreeDays.value) : 0)
const confirm = useConfirmModal()
function confirmWithdrawal() { confirm.open(withdraw, 'Отозвать заявку на отпуск?') }
async function onTypeChange(event) { await changeType(event.target.value); event.target.value = typeId.value }
const downloading = ref(false)
const docs = useVacationDocs()
const notifications = useNotificationStore()
async function downloadApplication() {
  downloading.value = true
  try { await docs.getDocument(vacation.value.id) }
  catch (error) { notifications.addNotification(error.message || 'Не удалось скачать заявление', 'error') }
  finally { downloading.value = false }
}
</script>

<style scoped>
.application-page { display: flex; flex-direction: column; gap: calc(var(--padding-secondary) / 2); width: 100%; }
.application-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
h1 { margin: .75rem 0 .35rem; font-size: 1.4rem; }
h2 { margin: 0 0 1rem; font-size: 1.1rem; }
h3 { font-size: .95rem; margin: 0; }
p { margin: .35rem 0; line-height: 1.5; }
.back-link { display: inline-flex; gap: .5rem; align-items: center; color: var(--muted-text); text-decoration: none; }
.back-link:hover { color: var(--accent); }
.application-columns { display: grid; grid-template-columns: minmax(0, 2fr) minmax(19rem, 1fr); gap: calc(var(--padding-secondary) / 2); align-items: start; }
.main-column, .additional-column { display: flex; flex-direction: column; gap: calc(var(--padding-secondary) / 2); min-width: 0; }
.main-column { align-self: stretch; }
.panel { padding: var(--padding-secondary); background: var(--foreground); border: 1px solid var(--border-color); border-radius: var(--border-radius); }
.state { text-align: center; padding: 3rem; }
.request-summary { container-type: inline-size; }
.summary-header { display: flex; align-items: center; justify-content: space-between; gap: var(--padding-secondary); margin-bottom: var(--padding-secondary); }
.summary-badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--gap-secondary); flex-shrink: 0; max-width: 45%; }

.employee { display: flex; align-items: center; gap: var(--gap-primary); min-width: 0; }
.employee-details { min-width: 0; }
.employee-name { margin: 0; font-size: 1.25rem; font-weight: 700; overflow-wrap: anywhere; }
.employee-details p { margin: .2rem 0 0; }
.avatar { display: flex; flex-shrink: 0; align-items: center; justify-content: center; height: 3rem; width: 3rem; border-radius: 50%; color: var(--on-accent); background: var(--accent); font-weight: 700; }
.muted, dt { color: var(--muted-text); font-size: .85rem; }
.facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--gap-primary); margin: 0; }
.fact-card { min-width: 0; padding: var(--padding-secondary); background: var(--muted-foreground); border: 1px solid var(--border-color); border-radius: var(--border-radius); }
.fact-card dd { font-size: 1.15rem; font-weight: 700; }
.period-value { color: var(--accent); }
.fact-card .type-select { margin: 0; font-weight: 600; height: auto; min-height: 2.25rem; padding: .35rem .5rem; font-size: .95rem; background: var(--foreground); }
.fact-card .type-select:disabled { opacity: 1; }
@container (max-width: 36rem) { .facts { grid-template-columns: 1fr; } }
@container (max-width: 28rem) { .summary-header { align-items: flex-start; flex-direction: column; } .summary-badges { max-width: 100%; justify-content: flex-start; } }
dd { margin: .4rem 0 0; font-weight: 600; }
.field-label, label { font-size: .85rem; }
.field { width: 100%; border: 1px solid var(--border-color); border-radius: var(--border-radius); color: var(--text); background: var(--background); padding: .5rem .8rem; margin-top: .4rem; font: inherit; font-size: .9rem; box-sizing: border-box; }
.field:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.field:disabled { opacity: .65; }
input.field, select.field { height: 3rem; }
textarea { resize: vertical; }
.description { margin-top: 1rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.warning-text { color: var(--warn); }
.error { color: var(--destructive); font-size: .85rem; }
.history { list-style: none; padding: 0 0 0 .5rem; margin: 0; }
.history li { position: relative; padding: 0 0 1.25rem 1.25rem; border-left: 1px solid var(--border-color); }
.history li:last-child { padding-bottom: 0; border-left-color: transparent; }
.history p { font-size: .85rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.history small { color: var(--muted-text); font-size: .75rem; }
.history-dot { position: absolute; left: -.3rem; top: .3rem; width: .55rem; height: .55rem; background: var(--accent); border-radius: 50%; }
.decision-panel { position: sticky; bottom: 1rem; z-index: 5; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; padding: var(--padding-secondary); background: var(--foreground); border: 1px solid var(--border-color); border-radius: var(--border-radius); box-shadow: 0 4px 24px #0002; }
.decision-comment { margin-top: var(--padding-secondary); }
.decision-comment-input { flex: 1; min-width: min(18rem, 100%); margin-top: 0; }
.decision-comment > label, .decision-comment > h3 { color: var(--muted-text); font-size: .85rem; font-weight: 600; }
.decision-comment .field { background: var(--foreground); }
.decision-comment .decision-result { margin: .5rem 0 0; }
.actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.decision-result { white-space: pre-wrap; overflow-wrap: anywhere; font-size: .9rem; }
.edit-form { margin-top: var(--padding-secondary); padding-top: var(--padding-secondary); border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: .85rem; }
.edit-period { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
@media (max-width: 1000px) { .application-columns { grid-template-columns: minmax(0,1fr); } }
@media (max-width: 600px) { .application-header { align-items: flex-start; flex-direction: column; } .panel { padding: 1rem; } .facts, .edit-period { grid-template-columns: 1fr; } .decision-panel { bottom: .5rem; padding: 1rem; } h1 { font-size: 1.4rem; } }
</style>
