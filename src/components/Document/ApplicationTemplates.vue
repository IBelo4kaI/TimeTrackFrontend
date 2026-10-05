<template>
  <div class="templates">
    <div class="templates__list">
      <ButtonUI
        v-for="template in APPLICATION_TEMPLATES"
        :key="template.id"
        :type="selected?.id === template.id ? 'accent' : 'muted'"
        icon="fa-regular fa-file-word"
        @click="select(template)"
      >
        <span>{{ template.title }}</span>
      </ButtonUI>
    </div>

    <div v-if="isLoading" class="templates__hint">
      <i class="fa-regular fa-spinner fa-spin"></i>
      Загружаем данные...
    </div>

    <form
      v-else-if="selected"
      class="templates__form"
      @submit.prevent="onSubmit"
    >
      <div v-if="!employeeFound" class="templates__hint">
        Вас нет в справочнике сотрудников — заполните поля вручную.
      </div>

      <div v-if="selected.textTemplates?.length" class="templates__texts">
        <span class="templates__label">Шаблон текста</span>
        <button
          v-for="t in selected.textTemplates"
          :key="t.id"
          type="button"
          class="templates__text-btn"
          :class="{ 'templates__text-btn--active': activeText?.id === t.id }"
          @click="applyTextTemplate(t)"
        >
          {{ renderText(t) }}
        </button>
      </div>

      <template v-for="group in groups" :key="group.title">
        <div class="templates__group-title">{{ group.title }}</div>

        <div class="templates__grid">
          <template v-for="field in group.fields" :key="field.key">
            <label
              v-if="field.type === 'textarea'"
              class="templates__field templates__field--wide"
            >
              <span class="templates__label">{{ field.label }}</span>
              <textarea
                v-model="values[field.key]"
                rows="6"
                :placeholder="field.placeholder"
              ></textarea>
            </label>

            <InputUi
              v-else
              v-model="values[field.key]"
              :type="field.type"
              :label="field.label"
              :placeholder="field.placeholder"
            />
          </template>
        </div>
      </template>

      <div class="templates__actions">
        <ButtonUI type="accent" icon="fa-regular fa-file-arrow-down">
          <span>Сформировать</span>
        </ButtonUI>
      </div>
    </form>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import {
  APPLICATION_TEMPLATES,
  HEADER_FIELDS,
} from '@/constants/applicationTemplates'
import { useApplicationTemplates } from '@/stores/applicationTemplates'
import { useNotificationStore } from '@/stores/notification'
import { formatDocDate } from '@/utils/docs.utils'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const templatesStore = useApplicationTemplates()
const notificationStore = useNotificationStore()

const selected = ref(null)
const activeText = ref(null)
const values = ref({})
const employeeFound = ref(true)
const fileName = ref('')
const isLoading = ref(false)

// Поля-параметры (param) видны, только когда выбрана заготовка текста с ними
const visibleFields = computed(() => {
  const template = selected.value
  if (!template) return []
  if (!template.textTemplates?.length) return template.fields
  return template.fields.filter(
    (f) => !f.param || activeText.value?.params.includes(f.key)
  )
})

// Сначала то, что пользователь заполняет сам, ниже — подставленное автоматически
const groups = computed(() =>
  selected.value
    ? [
        { title: 'Заполните', fields: visibleFields.value },
        { title: 'Заполнено автоматически', fields: HEADER_FIELDS },
      ]
    : []
)

// Текст заготовки с подставленными датами (или прочерками, пока даты не выбраны)
const renderText = (template) =>
  template.text.replace(/\{(\w+)\}/g, (_, key) =>
    values.value[key] ? formatDocDate(values.value[key]) : '__.__.____'
  )

let lastRendered = ''

const applyTextTemplate = (template) => {
  activeText.value = template
  lastRendered = renderText(template)
  values.value[selected.value.textField] = lastRendered
}

// Меняем параметры — текст пересобирается, если его не правили руками
watch(
  () => activeText.value?.params.map((key) => values.value[key]),
  () => {
    const field = selected.value?.textField
    if (!activeText.value || values.value[field] !== lastRendered) return
    lastRendered = renderText(activeText.value)
    values.value[field] = lastRendered
  }
)

const select = async (template) => {
  selected.value = template
  activeText.value = null
  lastRendered = ''
  isLoading.value = true
  try {
    const result = await templatesStore.buildValues(template)
    values.value = result.values
    employeeFound.value = result.employeeFound
    fileName.value = result.fileName ?? ''
  } catch (error) {
    // Справочник недоступен или данные неполные — форму можно заполнить вручную
    console.error('Не удалось подставить данные сотрудника:', error)
    values.value = templatesStore.emptyValues(template)
    employeeFound.value = false
    fileName.value = ''
  } finally {
    isLoading.value = false
  }
}

// Переход из календаря: ?template=timeoff&dateFrom=...&dateTo=... — сразу
// открываем шаблон с подставленными датами и подходящей заготовкой текста
const route = useRoute()

onMounted(async () => {
  const { template: id, dateFrom, dateTo } = route.query
  const template = APPLICATION_TEMPLATES.find((t) => t.id === id)
  if (!template) return

  await select(template)
  if (dateFrom) values.value.dateFrom = dateFrom
  if (dateTo) values.value.dateTo = dateTo

  const textId = dateFrom && dateFrom !== dateTo ? 'time-off-period' : 'time-off-day'
  const text = template.textTemplates?.find((t) => t.id === textId)
  if (text) applyTextTemplate(text)
})

const onSubmit = async () => {
  try {
    await templatesStore.generate(selected.value, values.value, fileName.value)
  } catch (error) {
    console.error('Ошибка при создании заявления:', error)
    notificationStore.addNotification(
      'Не удалось сформировать заявление',
      'error'
    )
  }
}
</script>

<style scoped>
.templates {
  display: flex;
  flex-direction: column;
  gap: var(--gap-primary);
}

.templates__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-secondary);
}

.templates__form {
  display: flex;
  flex-direction: column;
  gap: var(--gap-primary);
  padding: var(--padding-secondary);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.templates__group-title {
  font-weight: 600;
}

.templates__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--gap-primary);
}

.templates__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.templates__field--wide {
  grid-column: 1 / -1;
}

.templates__texts {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.templates__text-btn {
  padding: 0.7rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--background);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.templates__text-btn:hover,
.templates__text-btn--active {
  border-color: var(--accent);
}

.templates__label {
  font-size: 0.85rem;
  color: var(--muted-text);
}

textarea {
  padding: 0.7rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--background);
  color: var(--text);
  font: inherit;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.templates__hint {
  color: var(--muted-text);
}

.templates__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
