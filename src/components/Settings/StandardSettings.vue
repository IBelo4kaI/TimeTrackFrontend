<template>
  <div class="standard-setting">
    <div class="standard-setting__title">Нормы часов и дней</div>
    <div class="standard-setting__header">
      <Tabs
        :tabs="scopeTabs"
        v-model="scope"
        type="line"
        @update:model-value="onScopeChange"
      />
      <SelectUI
        v-model="selectedYear"
        :options="yearOptions"
        @update:model-value="loadStandards"
      />
      <template v-if="scope === 'individual'">
        <SelectUI
          v-model="selectedUser"
          :options="userOptions"
          placeholder="Выберите сотрудника"
          @update:model-value="loadStandards"
        />
      </template>
    </div>

    <LoaderTitle v-if="!isInitialized" />

    <template v-else-if="scope === 'individual' && !selectedUser">
      <div class="standard-setting__empty">
        Выберите сотрудника, чтобы посмотреть или задать его индивидуальный
        график
      </div>
    </template>

    <div v-else class="standard-setting__grid">
      <button
        v-for="month in months"
        :key="month.value"
        type="button"
        class="month-card"
        @click="openMonthModal(month)"
      >
        <div class="month-card__header">
          <span class="month-card__title">{{ month.label }}</span>
          <i class="fa-regular fa-pen month-card__edit-icon"></i>
        </div>
        <div class="month-card__row">
          Мужчины: {{ getMonthData(month.value).men.standardHours }}ч ·
          {{ getMonthData(month.value).men.standardDays }}дн
        </div>
        <div class="month-card__row">
          Женщины: {{ getMonthData(month.value).women.standardHours }}ч ·
          {{ getMonthData(month.value).women.standardDays }}дн
        </div>
      </button>
    </div>

    <div v-if="error" class="standard-setting__error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import SelectUI from '@/components/SelectUI.vue'
import Tabs from '@/components/Tabs.vue'
import {
  createStandard,
  deleteStandard,
  getStandardsByYear,
  updateStandard,
} from '@/services/workStandard.api'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { computed, onMounted, ref } from 'vue'

// Константы
const months = [
  { value: 1, label: 'Январь' },
  { value: 2, label: 'Февраль' },
  { value: 3, label: 'Март' },
  { value: 4, label: 'Апрель' },
  { value: 5, label: 'Май' },
  { value: 6, label: 'Июнь' },
  { value: 7, label: 'Июль' },
  { value: 8, label: 'Август' },
  { value: 9, label: 'Сентябрь' },
  { value: 10, label: 'Октябрь' },
  { value: 11, label: 'Ноябрь' },
  { value: 12, label: 'Декабрь' },
]

const scopeTabs = [
  { id: 'general', label: 'Общие нормы' },
  { id: 'individual', label: 'Индивидуальные' },
]

// Store
const userStore = useUserStore()
const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

// Реактивные переменные
const selectedYear = ref(new Date().getFullYear())
const scope = ref('general')
const selectedUser = ref(null) // string = userId сотрудника, только при scope === 'individual'
const standards = ref({})
const isInitialized = ref(false)
const isLoading = ref(false)
const error = ref('')

// Вычисляемые свойства
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    years.push({ value: i, label: i.toString() })
  }
  return years
})

const userOptions = computed(() =>
  (userStore.usersAll ?? []).map((user) => ({
    value: user.id,
    label:
      `${user.surname} ${user.name} ${user.patronymic ? user.patronymic : ''}`.trim(),
  }))
)

const getMonthData = (month) => {
  if (!standards.value[month]) {
    // Возвращаем пустую структуру если данных нет
    return {
      men: emptyRecord(month, 1),
      women: emptyRecord(month, 2),
    }
  }
  return standards.value[month]
}

function emptyRecord(month, gender) {
  return {
    id: null,
    userId: selectedUser.value,
    month,
    year: selectedYear.value,
    standardHours: 0,
    standardDays: 0,
    gender,
  }
}

// Инициализация стандартов
const initializeStandards = () => {
  const initialStandards = {}
  months.forEach((month) => {
    initialStandards[month.value] = {
      men: emptyRecord(month.value, 1),
      women: emptyRecord(month.value, 2),
    }
  })
  standards.value = initialStandards
  isInitialized.value = true
}

function onScopeChange(newScope) {
  if (newScope === 'general') selectedUser.value = null
  loadStandards()
}

// Загрузка стандартов
const loadStandards = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const data = await getStandardsByYear(selectedYear.value)

    // Инициализируем стандарты
    initializeStandards()

    // Заполняем данными из API
    if (data && Array.isArray(data)) {
      data.forEach((standard) => {
        if (standard.month >= 1 && standard.month <= 12) {
          const monthKey = standard.month
          const genderKey = standard.gender === 1 ? 'men' : 'women'

          // Обрабатываем объект userId
          const userId = standard.userId?.Valid ? standard.userId.String : null

          // Фильтруем данные по выбранному пользователю
          const isMatch =
            (selectedUser.value === null && userId === null) ||
            selectedUser.value === userId

          if (isMatch && standards.value[monthKey]) {
            standards.value[monthKey][genderKey] = {
              id: standard.id,
              userId: userId,
              month: standard.month,
              year: standard.year,
              standardHours: standard.standardHours,
              standardDays: standard.standardDays,
              gender: standard.gender,
            }
          }
        }
      })
    }
  } catch (err) {
    console.error('Ошибка при загрузке стандартов:', err)
    error.value = 'Не удалось загрузить данные. Пожалуйста, попробуйте еще раз.'
    initializeStandards()
  } finally {
    isLoading.value = false
  }
}

// Сохранение одной записи стандарта
const saveStandardRecord = async (standard) => {
  const standardData = {
    month: standard.month,
    year: standard.year,
    standard_hours: standard.standardHours,
    standard_days: standard.standardDays,
    gender: standard.gender,
  }

  // Добавляем userId, если выбран сотрудник
  if (selectedUser.value) {
    standardData.user_id = selectedUser.value
  }

  if (standard.id) {
    // Обновление существующего стандарта
    await updateStandard(standard.id, {
      standard_hours: standard.standardHours,
      standard_days: standard.standardDays,
    })
  } else {
    // Создание нового стандарта
    const response = await createStandard(standardData)
    standard.id = response.id
  }
}

// Модалка редактирования нормы месяца — применяется сразу по кнопке в окне.
function openMonthModal(month) {
  const monthData = getMonthData(month.value)
  const hasIndividualRecord =
    scope.value === 'individual' && (monthData.men.id || monthData.women.id)

  modalStore.open({
    title: `Норма — ${month.label}`,
    submitButtonText: 'Сохранить',
    submittingText: 'Сохранение...',
    showDeleteButton: hasIndividualRecord,
    deleteButtonText: 'Удалить',
    deletingText: 'Удаление...',
    fields: [
      {
        name: 'menHours',
        type: 'number',
        label: 'Мужчины — часы',
        value: monthData.men.standardHours,
      },
      {
        name: 'menDays',
        type: 'number',
        label: 'Мужчины — дни',
        value: monthData.men.standardDays,
      },
      {
        name: 'womenHours',
        type: 'number',
        label: 'Женщины — часы',
        value: monthData.women.standardHours,
      },
      {
        name: 'womenDays',
        type: 'number',
        label: 'Женщины — дни',
        value: monthData.women.standardDays,
      },
    ],
    onSubmit: async (data) => {
      try {
        monthData.men.standardHours = Number(data.menHours) || 0
        monthData.men.standardDays = Number(data.menDays) || 0
        monthData.women.standardHours = Number(data.womenHours) || 0
        monthData.women.standardDays = Number(data.womenDays) || 0

        await saveStandardRecord(monthData.men)
        await saveStandardRecord(monthData.women)
        standards.value[month.value] = monthData
      } catch (err) {
        console.error('Ошибка при сохранении стандартов:', err)
        notificationStore.addNotification('Не удалось сохранить норму', 'error')
        throw err
      }
      notificationStore.addNotification('Норма сохранена', 'success')
    },
    onDelete: async () => {
      try {
        if (monthData.men.id) await deleteStandard(monthData.men.id)
        if (monthData.women.id) await deleteStandard(monthData.women.id)
        standards.value[month.value] = {
          men: emptyRecord(month.value, 1),
          women: emptyRecord(month.value, 2),
        }
      } catch (err) {
        console.error('Ошибка при удалении стандартов:', err)
        notificationStore.addNotification('Не удалось удалить норму', 'error')
        throw err
      }
      notificationStore.addNotification('Норма удалена', 'success')
    },
  })
}

// Загрузка пользователей при монтировании
onMounted(async () => {
  // Загружаем список пользователей если еще не загружен
  if (userStore.usersAll.length === 0) {
    await userStore.userAllFetch()
  }

  initializeStandards()
  loadStandards()
})
</script>

<style scoped>
.standard-setting {
  display: flex;
  flex-direction: column;
  gap: var(--gap-primary);
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.standard-setting__title {
  display: flex;
  align-items: center;
  padding: var(--padding-secondary) var(--padding-secondary);
  font-size: 1.14rem;
  font-weight: 600;
  color: var(--text);
}

.standard-setting__header {
  display: flex;
  gap: 1rem;
}

.standard-setting__control-group {
  width: 14rem;
  max-width: 100%;
}

.standard-setting__empty {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--muted-text);
  font-size: 0.93rem;
}

.standard-setting__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: calc(var(--padding-secondary) / 2);
}

.month-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.36rem;
  padding: 0.86rem;
  background: var(--background);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.month-card:hover {
  border-color: var(--accent);
}

.month-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.month-card__title {
  font-weight: 600;
  color: var(--text);
}

.month-card__edit-icon {
  color: var(--muted-text);
}

.month-card:hover .month-card__edit-icon {
  color: var(--accent);
}

.month-card__row {
  font-size: 0.86rem;
  color: var(--muted-text);
}

.standard-setting__error {
  padding: 1rem;
  background: var(--muted-destructive);
  color: var(--destructive);
  border-radius: var(--border-radius);
  text-align: center;
}
</style>
