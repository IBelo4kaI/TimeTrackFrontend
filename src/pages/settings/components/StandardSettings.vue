<template>
  <div class="standard-setting">
    <div class="standard-setting__header">
      <h2>Нормы часов и дней</h2>
      <div class="standard-setting__controls">
        <div class="standard-setting__control-group">
          <SelectUI
            v-model="selectedYear"
            :options="yearOptions"
            label="Год"
            @update:model-value="loadStandards"
          />
        </div>
        <div class="standard-setting__control-group">
          <SelectUI
            v-model="selectedUser"
            :options="userOptions"
            label="Сотрудник"
            placeholder="Общие нормы"
            @update:model-value="loadStandards"
          />
        </div>
      </div>
    </div>

    <div v-if="!isInitialized" class="standard-setting__loading">
      <Loader />
    </div>

    <div v-else class="standard-setting__content">
      <div v-if="selectedUser" class="standard-setting__user-info">
        <div class="standard-setting__user-name">
          Индивидуальные нормы для:
          <strong>{{ selectedUserName }}</strong>
        </div>
        <div class="standard-setting__user-hint">
          Эти нормы будут применяться только к выбранному сотруднику
        </div>
      </div>
      <div v-else class="standard-setting__user-info">
        <div class="standard-setting__user-name">
          <strong>Общие нормы</strong>
        </div>
        <div class="standard-setting__user-hint">
          Эти нормы будут применяться ко всем сотрудникам, у которых нет
          индивидуальных норм
        </div>
      </div>

      <div class="standard-setting__table-container">
        <table class="standard-setting__table">
          <thead>
            <tr>
              <th rowspan="2">Месяц</th>
              <th colspan="2" class="text-center">Мужчины</th>
              <th colspan="2" class="text-center">Женщины</th>
              <th rowspan="2">Действия</th>
            </tr>
            <tr>
              <th>Часы</th>
              <th>Дни</th>
              <th>Часы</th>
              <th>Дни</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="month in months" :key="month.value">
              <td class="standard-setting__month-cell">
                {{ month.label }}
              </td>

              <!-- Мужчины (gender: 1) -->
              <td>
                <InputUi
                  v-model="getMonthData(month.value).men.standardHours"
                  type="number"
                  placeholder="Часы"
                  :min="0"
                  @input="markAsChanged(month.value, 'men')"
                />
              </td>
              <td>
                <InputUi
                  v-model="getMonthData(month.value).men.standardDays"
                  type="number"
                  placeholder="Дни"
                  :min="0"
                  @input="markAsChanged(month.value, 'men')"
                />
              </td>

              <!-- Женщины (gender: 2) -->
              <td>
                <InputUi
                  v-model="getMonthData(month.value).women.standardHours"
                  type="number"
                  placeholder="Часы"
                  :min="0"
                  @input="markAsChanged(month.value, 'women')"
                />
              </td>
              <td>
                <InputUi
                  v-model="getMonthData(month.value).women.standardDays"
                  type="number"
                  placeholder="Дни"
                  :min="0"
                  @input="markAsChanged(month.value, 'women')"
                />
              </td>

              <td class="standard-setting__actions-cell">
                <div class="standard-setting__action-buttons">
                  <ButtonUI
                    type="accent"
                    :disabled="
                      !hasChanges(month.value) || isSaving(month.value)
                    "
                    @click="saveMonthStandards(month.value)"
                  >
                    <template v-if="isSaving(month.value)">
                      <i class="fa-regular fa-loader fa-spin"></i>
                      Сохранение...
                    </template>
                    <template v-else>
                      {{
                        getMonthData(month.value).men.id ||
                        getMonthData(month.value).women.id
                          ? 'Обновить'
                          : 'Создать'
                      }}
                    </template>
                  </ButtonUI>

                  <!-- Кнопка удаления (только для индивидуальных норм с существующими записями) -->
                  <ButtonUI
                    v-if="
                      selectedUser &&
                      (getMonthData(month.value).men.id ||
                        getMonthData(month.value).women.id)
                    "
                    type="destructive"
                    :disabled="isDeleting(month.value)"
                    @click="deleteMonthStandards(month.value)"
                  >
                    <template v-if="isDeleting(month.value)">
                      <i class="fa-regular fa-loader fa-spin"></i>
                      Удаление...
                    </template>
                    <template v-else>
                      <i class="fa-regular fa-trash"></i>
                      Удалить
                    </template>
                  </ButtonUI>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="error" class="standard-setting__error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  getStandardsByYear,
  createStandard,
  updateStandard,
  deleteStandard,
} from '@/services/workStandard.api'
import { useUserStore } from '@/stores/user'
import InputUi from '@/components/InputUi.vue'
import Loader from '@/components/Loader.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import SelectUI from '@/components/SelectUI.vue'

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

// Store
const userStore = useUserStore()

// Реактивные переменные
const selectedYear = ref(new Date().getFullYear())
const selectedUser = ref(null) // null = общие нормы, string = userId сотрудника
const standards = ref({})
const isInitialized = ref(false)
const isLoading = ref(false)
const error = ref('')
const savingMonths = ref(new Set())
const deletingMonths = ref(new Set())

// Вычисляемые свойства
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 2; i++) {
    years.push({ value: i, label: i.toString() })
  }
  return years
})

const userOptions = computed(() => {
  const options = [{ value: null, label: 'Общие нормы' }]

  if (userStore.usersAll && userStore.usersAll.length > 0) {
    userStore.usersAll.forEach((user) => {
      options.push({
        value: user.id,
        label:
          `${user.surname} ${user.name} ${user.patronymic ? user.patronymic : ''}`.trim(),
        user: user,
      })
    })
  }

  return options
})

const selectedUserName = computed(() => {
  if (!selectedUser.value) return ''

  const userOption = userOptions.value.find(
    (option) => option.value === selectedUser.value
  )
  return userOption ? userOption.label : ''
})

// Вспомогательные функции
const isSaving = (month) => savingMonths.value.has(month)
const isDeleting = (month) => deletingMonths.value.has(month)

const hasChanges = (month) => {
  const monthData = getMonthData(month)
  return monthData.men.isChanged || monthData.women.isChanged
}

const getMonthData = (month) => {
  if (!standards.value[month]) {
    // Возвращаем пустую структуру если данных нет
    return {
      men: {
        id: null,
        userId: selectedUser.value,
        month: month,
        year: selectedYear.value,
        standardHours: 0,
        standardDays: 0,
        gender: 1,
        isChanged: false,
      },
      women: {
        id: null,
        userId: selectedUser.value,
        month: month,
        year: selectedYear.value,
        standardHours: 0,
        standardDays: 0,
        gender: 2,
        isChanged: false,
      },
    }
  }
  return standards.value[month]
}

// Инициализация стандартов
const initializeStandards = () => {
  const initialStandards = {}
  months.forEach((month) => {
    initialStandards[month.value] = {
      men: {
        id: null,
        userId: selectedUser.value,
        month: month.value,
        year: selectedYear.value,
        standardHours: 0,
        standardDays: 0,
        gender: 1,
        isChanged: false,
      },
      women: {
        id: null,
        userId: selectedUser.value,
        month: month.value,
        year: selectedYear.value,
        standardHours: 0,
        standardDays: 0,
        gender: 2,
        isChanged: false,
      },
    }
  })
  standards.value = initialStandards
  isInitialized.value = true
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
          if (selectedUser.value === null && userId === null) {
            // Общие нормы (userId = null)
            if (standards.value[monthKey]) {
              standards.value[monthKey][genderKey] = {
                id: standard.id,
                userId: userId,
                month: standard.month,
                year: standard.year,
                standardHours: standard.standardHours,
                standardDays: standard.standardDays,
                gender: standard.gender,
                isChanged: false,
              }
            }
          } else if (selectedUser.value === userId) {
            // Индивидуальные нормы для выбранного пользователя
            if (standards.value[monthKey]) {
              standards.value[monthKey][genderKey] = {
                id: standard.id,
                userId: userId,
                month: standard.month,
                year: standard.year,
                standardHours: standard.standardHours,
                standardDays: standard.standardDays,
                gender: standard.gender,
                isChanged: false,
              }
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

// Отметка как измененного
const markAsChanged = (month, gender) => {
  const monthData = getMonthData(month)
  if (monthData && monthData[gender]) {
    // Обновляем данные в standards
    if (!standards.value[month]) {
      standards.value[month] = { ...monthData }
    }
    standards.value[month][gender].isChanged = true
  }
}

// Сохранение стандартов для месяца (оба пола)
const saveMonthStandards = async (month) => {
  const monthData = getMonthData(month)
  if (!monthData || (!monthData.men.isChanged && !monthData.women.isChanged))
    return

  savingMonths.value.add(month)
  error.value = ''

  try {
    // Сохраняем стандарты для мужчин
    if (monthData.men.isChanged) {
      await saveStandardRecord(monthData.men)
      if (standards.value[month]) {
        standards.value[month].men.isChanged = false
      }
    }

    // Сохраняем стандарты для женщин
    if (monthData.women.isChanged) {
      await saveStandardRecord(monthData.women)
      if (standards.value[month]) {
        standards.value[month].women.isChanged = false
      }
    }
  } catch (err) {
    console.error('Ошибка при сохранении стандартов:', err)
    error.value = 'Не удалось сохранить данные. Пожалуйста, попробуйте еще раз.'
  } finally {
    savingMonths.value.delete(month)
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
    const updateData = {
      standard_hours: standard.standardHours,
      standard_days: standard.standardDays,
    }
    await updateStandard(standard.id, updateData)
  } else {
    // Создание нового стандарта
    const response = await createStandard(standardData)
    standard.id = response.id
  }
}

// Удаление стандартов для месяца (оба пола)
const deleteMonthStandards = async (month) => {
  const monthData = getMonthData(month)
  if (!monthData || (!monthData.men.id && !monthData.women.id)) return

  if (
    !confirm(
      'Вы уверены, что хотите удалить индивидуальные нормы для этого месяца?'
    )
  ) {
    return
  }

  deletingMonths.value.add(month)
  error.value = ''

  try {
    // Удаляем стандарты для мужчин
    if (monthData.men.id) {
      await deleteStandard(monthData.men.id)
      if (standards.value[month]) {
        standards.value[month].men.id = null
        standards.value[month].men.standardHours = 0
        standards.value[month].men.standardDays = 0
        standards.value[month].men.isChanged = false
      }
    }

    // Удаляем стандарты для женщин
    if (monthData.women.id) {
      await deleteStandard(monthData.women.id)
      if (standards.value[month]) {
        standards.value[month].women.id = null
        standards.value[month].women.standardHours = 0
        standards.value[month].women.standardDays = 0
        standards.value[month].women.isChanged = false
      }
    }
  } catch (err) {
    console.error('Ошибка при удалении стандартов:', err)
    error.value = 'Не удалось удалить данные. Пожалуйста, попробуйте еще раз.'
  } finally {
    deletingMonths.value.delete(month)
  }
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

// Наблюдаем за изменениями usersAll
watch(
  () => userStore.usersAll,
  () => {
    // Обновляем опции пользователей при изменении списка
  },
  { deep: true }
)
</script>

<style scoped>
.standard-setting {
  padding: 1.5rem;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.standard-setting__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.standard-setting__header h2 {
  margin: 0;
  color: var(--text);
  font-size: 1.5rem;
  font-weight: 600;
  flex: 1;
  min-width: 200px;
}

.standard-setting__controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.standard-setting__control-group {
  width: 200px;
}

.standard-setting__content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.standard-setting__user-info {
  padding: 1rem;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.standard-setting__user-name {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: var(--text);
}

.standard-setting__user-hint {
  font-size: 0.9rem;
  color: var(--muted-text);
}

.standard-setting__table-container {
  overflow-x: auto;
}

.standard-setting__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.standard-setting__table th {
  text-align: left;
  padding: 1rem;
  background: var(--foreground);
  color: var(--text);
  font-weight: 600;
  border-bottom: 0.07rem solid var(--border-color);
}

.standard-setting__table th.text-center {
  text-align: center;
}

.standard-setting__table td {
  padding: 1rem;
  border-bottom: 0.07rem solid var(--border-color);
  vertical-align: middle;
}

.standard-setting__month-cell {
  font-weight: 500;
  color: var(--text);
  min-width: 120px;
}

.standard-setting__actions-cell {
  min-width: 150px;
}

.standard-setting__action-buttons {
  display: flex;
  gap: 0.5rem;
}

.standard-setting__table tr:hover {
  background: var(--background);
}

.standard-setting__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.standard-setting__error {
  padding: 1rem;
  background: var(--muted-destructive);
  color: var(--destructive);
  border-radius: var(--border-radius);
  margin-top: 1rem;
  text-align: center;
}

@media (max-width: 768px) {
  .standard-setting__header {
    flex-direction: column;
  }

  .standard-setting__controls {
    width: 100%;
  }

  .standard-setting__control-group {
    width: 100%;
  }
}
</style>
