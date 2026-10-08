<template>
  <div class="container">
    <div class="top-row">
      <button type="button" class="back-link" @click="goBack">
        <i class="fa-regular fa-arrow-left"></i>
        Назад
      </button>
      <ButtonUI type="muted" icon="fa-regular fa-xmark" @click="goBack">
        Отмена
      </ButtonUI>
    </div>

    <ol class="stepper">
      <li
        v-for="(s, i) in steps"
        :key="s.id"
        class="stepper__item"
        :class="{
          'stepper__item--current': step === i + 1,
          'stepper__item--done': i + 1 < furthest && step !== i + 1,
          'stepper__item--error': stepHasError(i + 1),
        }"
      >
        <button
          type="button"
          class="stepper__button"
          :disabled="i + 1 > furthest"
          @click="goTo(i + 1)"
        >
          <span class="stepper__num">
            <i
              v-if="i + 1 < furthest && step !== i + 1 && !stepHasError(i + 1)"
              class="fa-regular fa-check"
            ></i>
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="stepper__label">{{ s.label }}</span>
        </button>
      </li>
    </ol>

    <section class="panel">
      <!-- 1. Кому и какой тип -->
      <template v-if="step === 1">
        <h3 class="panel__title">
          {{ isAdmin ? 'Кому и какой тип' : 'Какой тип отпуска' }}
        </h3>

        <template v-if="isAdmin">
          <div class="field">
            <Autocomplete
              v-model="formData.userId"
              :options="userStore.usersAll"
              :label-key="['surname', 'name']"
              value-key="id"
              :is-show-button="false"
              label="Сотрудник"
              placeholder="Найти сотрудника"
              empty-text="Сотрудник не найден"
              :error="errors.userId ?? ''"
            />
          </div>

          <div class="field">
            <label class="field__label">Статус заявки</label>
            <SelectUI
              v-model="formData.status"
              :options="statusOptions"
              full-width
            />
          </div>
        </template>

        <div class="field">
          <label class="field__label">Тип отпуска</label>
          <div class="type-grid">
            <button
              v-for="t in vacationTypes"
              :key="t.id"
              type="button"
              class="type-card"
              :class="{ 'type-card--active': formData.vacationTypeId === t.id }"
              @click="selectType(t.id)"
            >
              <span class="type-card__name">
                <i
                  class="type-card__dot"
                  :style="{ background: t.colorCode }"
                ></i>
                {{ t.name }}
              </span>
              <span class="type-card__hint">
                {{
                  t.affectsBalance
                    ? 'Списывается из баланса'
                    : 'Не списывается из баланса'
                }}
              </span>
            </button>
          </div>
          <span v-if="errors.vacationTypeId" class="field__error">
            {{ errors.vacationTypeId }}
          </span>
        </div>
      </template>

      <!-- 2. Период -->
      <template v-else-if="step === 2">
        <h3 class="panel__title">Период</h3>

        <div class="period">
          <div class="period__form">
            <Tabs :tabs="endModeTabs" v-model="endMode" type="line" />

            <InputUi
              v-model="formData.startDate"
              type="date"
              label="Дата начала"
              :required="true"
              :error="errors.startDate"
              @input="errors.startDate = null"
            />

            <InputUi
              v-if="endMode === 'date'"
              v-model="formData.endDate"
              type="date"
              label="Дата окончания"
              :required="true"
              :error="errors.endDate"
              @input="errors.endDate = null"
            />
            <InputUi
              v-else
              v-model="daysInput"
              type="number"
              label="Количество дней отпуска"
              :required="true"
              :error="errors.endDate"
              @input="errors.endDate = null"
            />

            <div class="info-box">
              <div v-if="endMode === 'days' && formData.endDate">
                Дата окончания: {{ formatDate(formData.endDate) }}
              </div>
              <div v-if="currentDays != null">
                Продолжительность:
                <b>{{ formatStats(currentDays) }}</b>
              </div>
              <div v-if="freeDays != null">
                Остаток в году:
                <b>{{ formatStats(freeDays) }}</b>
                <template v-if="freeAfter != null">
                  · после отпуска:
                  <b :class="{ negative: freeAfter < 0 }">
                    {{ formatStats(freeAfter) }}
                  </b>
                </template>
              </div>
              <div v-if="currentDays == null && freeDays == null" class="muted">
                Выберите даты в календаре или в полях
              </div>
            </div>
          </div>

          <div class="period__main">
            <VacationRangeCalendar
              :start-date="formData.startDate"
              :end-date="formData.endDate"
              :user-id="formData.userId"
              :days="currentDays"
              @select="setDates"
            />

            <div v-if="adjacent.length" class="adjacent">
              <div class="adjacent__title">
                Смежные отпуска · {{ department }}
              </div>
              <div class="adjacent__list">
                <div v-for="v in adjacent" :key="v.id" class="adjacent__item">
                  <i class="adjacent__dot" :style="{ background: v.color }"></i>
                  <span class="adjacent__name">{{ v.name }}</span>
                  <span class="adjacent__dates">
                    {{ formatDate(v.startDate) }} — {{ formatDate(v.endDate) }}
                  </span>
                  <span v-if="v.status === 'pending'" class="muted">
                    (на рассмотрении)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 3. Комментарий -->
      <template v-else-if="step === 3">
        <h3 class="panel__title">Комментарий</h3>
        <div class="field">
          <label class="field__label">Описание (необязательно)</label>
          <textarea
            v-model="formData.description"
            class="textarea"
            rows="6"
            placeholder="Например, куда планируется поездка или на что просим обратить внимание"
          ></textarea>
        </div>
      </template>

      <!-- 4. Проверка и отправка -->
      <template v-else>
        <h3 class="panel__title">Проверка заявки</h3>

        <dl class="summary">
          <div class="summary__row">
            <dt>Сотрудник</dt>
            <dd>{{ employeeName }}</dd>
            <button
              v-if="isAdmin"
              type="button"
              class="summary__edit"
              @click="goTo(1)"
            >
              Изменить
            </button>
          </div>
          <div class="summary__row">
            <dt>Тип отпуска</dt>
            <dd>{{ selectedType?.name ?? '—' }}</dd>
            <button type="button" class="summary__edit" @click="goTo(1)">
              Изменить
            </button>
          </div>
          <div v-if="isAdmin" class="summary__row">
            <dt>Статус</dt>
            <dd>{{ statusLabel }}</dd>
            <button type="button" class="summary__edit" @click="goTo(1)">
              Изменить
            </button>
          </div>
          <div class="summary__row">
            <dt>Период</dt>
            <dd>
              {{ formatDate(formData.startDate) }} —
              {{ formatDate(formData.endDate) }}
              <template v-if="currentDays != null">
                · {{ formatStats(currentDays) }}
              </template>
            </dd>
            <button type="button" class="summary__edit" @click="goTo(2)">
              Изменить
            </button>
          </div>
          <div v-if="freeAfter != null" class="summary__row">
            <dt>Остаток после отпуска</dt>
            <dd :class="{ negative: freeAfter < 0 }">
              {{ formatStats(freeAfter) }}
            </dd>
          </div>
          <div class="summary__row">
            <dt>Комментарий</dt>
            <dd>{{ formData.description || '—' }}</dd>
            <button type="button" class="summary__edit" @click="goTo(3)">
              Изменить
            </button>
          </div>
        </dl>
      </template>
    </section>

    <div class="footer">
      <ButtonUI
        type="muted"
        icon="fa-regular fa-arrow-left"
        :disabled="step === 1 || isSubmitting"
        @click="back"
      >
        Назад
      </ButtonUI>

      <ButtonUI
        v-if="step < steps.length"
        type="accent"
        icon="fa-regular fa-arrow-right"
        @click="next"
      >
        Далее
      </ButtonUI>
      <ButtonUI
        v-else
        type="success"
        icon="fa-regular fa-check"
        :disabled="isSubmitting"
        @click="onSubmit"
      >
        {{ isSubmitting ? 'Создание...' : 'Создать заявку' }}
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import Autocomplete from '@/components/Autocomplete.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import VacationRangeCalendar from '@/components/Vacation/VacationRangeCalendar.vue'
import { useDepartmentVacations } from '@/helpers/useDepartmentVacations'
import { useVacationForm } from '@/helpers/useVacationForm'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { formatStats } from '@/utils/vacation.utils'
import { computed, ref, toRef } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()

useHeaderTitleStore().setTitle('Создание отпуска', 'Новая заявка по шагам')

const {
  isAdmin,
  formData,
  errors,
  vacationTypes,
  selectedType,
  employeeName,
  statusOptions,
  endMode,
  daysInput,
  currentDays,
  freeDays,
  freeAfter,
  isSubmitting,
  isDirty,
  setDates,
  validateWho,
  validatePeriod,
  submit,
} = useVacationForm()

const { department, adjacent } = useDepartmentVacations(
  toRef(formData, 'userId'),
  toRef(formData, 'startDate'),
  toRef(formData, 'endDate')
)

const endModeTabs = [
  { id: 'date', label: 'Дата окончания' },
  { id: 'days', label: 'Количество дней' },
]

const steps = [
  { id: 'who', label: isAdmin ? 'Кому и тип' : 'Тип отпуска' },
  { id: 'period', label: 'Период' },
  { id: 'comment', label: 'Комментарий' },
  { id: 'review', label: 'Проверка' },
]

const step = ref(1)
// Дальше этого шага ещё не заходили — на него нельзя перепрыгнуть
const furthest = ref(1)

const statusLabel = computed(
  () => statusOptions.find((o) => o.value === formData.status)?.label ?? ''
)

const formatDate = (str) => (str ? str.split('-').reverse().join('.') : '—')

function selectType(id) {
  formData.vacationTypeId = id
  errors.vacationTypeId = null
}

function stepHasError(n) {
  if (n === 1) return !!(errors.userId || errors.vacationTypeId)
  if (n === 2) return !!(errors.startDate || errors.endDate)
  return false
}

function next() {
  if (step.value === 1 && !validateWho()) return
  if (step.value === 2 && !validatePeriod()) return
  step.value++
  furthest.value = Math.max(furthest.value, step.value)
}

function back() {
  if (step.value > 1) step.value--
}

function goTo(n) {
  if (n <= furthest.value) step.value = n
}

let submitted = false

async function onSubmit() {
  // Данные могли измениться после прохождения шагов — проверяем всё заново
  if (!validateWho()) return goTo(1)
  if (!validatePeriod()) return goTo(2)

  if (await submit()) {
    submitted = true
    router.push({ name: 'vacation' })
  }
}

function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'vacation' })
}

onBeforeRouteLeave(() => {
  if (!isDirty.value || submitted) return true
  return window.confirm('Введённые данные не сохранятся. Уйти со страницы?')
})
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  height: 100%;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  color: var(--muted-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--accent);
}

/* ---------- индикатор шагов ---------- */

.stepper {
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stepper__item {
  flex: 1;
  min-width: 0;
}

.stepper__button {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--muted-text);
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.stepper__button:disabled {
  cursor: default;
  opacity: 0.6;
}

.stepper__num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 50%;
  background: var(--muted-foreground);
  font-size: 0.85rem;
  font-weight: 700;
}

.stepper__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.stepper__item--current .stepper__button {
  border-color: var(--accent);
  color: var(--text);
}

.stepper__item--current .stepper__num {
  background: var(--accent);
  color: var(--on-accent);
}

.stepper__item--done .stepper__num {
  background: var(--muted-success);
  color: var(--success);
}

.stepper__item--error .stepper__button {
  border-color: var(--destructive);
}

.stepper__item--error .stepper__num {
  background: var(--muted-destructive);
  color: var(--destructive);
}

/* ---------- содержимое шага ---------- */

.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.panel__title {
  margin: 0;
  font-size: 1.2rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 34rem;
}

.field__label {
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 500;
}

.field__error {
  color: var(--destructive);
  font-size: 0.85rem;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.6rem;
}

.type-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.8rem 1rem;
  background: var(--background);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.type-card:hover {
  border-color: var(--accent);
}

.type-card--active {
  border-color: var(--accent);
  background: var(--muted-accent);
}

.type-card__name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.type-card__dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
}

.type-card__hint {
  color: var(--muted-text);
  font-size: 0.85rem;
}

.period {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.period__form {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 20rem;
  flex-shrink: 0;
}

.info-box {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.8rem 1rem;
  background: var(--muted-foreground);
  border-radius: var(--border-radius);
  font-size: 0.95rem;
}

.period__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
  min-width: 0;
}

.adjacent {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 0.9rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.adjacent__title {
  font-weight: 600;
}

.adjacent__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.adjacent__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.adjacent__dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.adjacent__dates {
  color: var(--muted-text);
}

.muted {
  color: var(--muted-text);
}

.negative {
  color: var(--destructive);
}

.textarea {
  width: 100%;
  padding: 0.7rem 0.9rem;
  background: var(--background);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text);
  font: inherit;
  resize: vertical;
}

.textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.summary {
  display: flex;
  flex-direction: column;
  margin: 0;
}

.summary__row {
  display: grid;
  grid-template-columns: 12rem 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 0.07rem solid var(--border-color);
}

.summary__row:last-child {
  border-bottom: none;
}

.summary__row dt {
  color: var(--muted-text);
}

.summary__row dd {
  margin: 0;
  font-weight: 600;
}

.summary__edit {
  background: none;
  border: none;
  padding: 0;
  color: var(--accent);
  font: inherit;
  cursor: pointer;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .stepper__label {
    display: none;
  }

  .stepper__item--current .stepper__label {
    display: block;
  }

  .stepper__item--current {
    flex: 3;
  }

  .period {
    flex-direction: column;
    align-items: stretch;
  }

  .period__form {
    width: 100%;
  }

  .summary__row {
    grid-template-columns: 1fr auto;
  }

  .summary__row dt {
    grid-column: 1 / -1;
  }
}
</style>
