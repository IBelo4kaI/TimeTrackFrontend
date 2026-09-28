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

      <template v-for="group in groups" :key="group.title">
        <div class="templates__group-title">{{ group.title }}</div>

        <div class="templates__grid">
          <template v-for="field in group.fields" :key="field.key">
            <template v-if="field.type === 'textarea'">
              <div
                v-if="selected.textTemplates?.length"
                class="templates__texts templates__field--wide"
              >
                <span class="templates__label">Шаблон текста</span>
                <button
                  v-for="t in selected.textTemplates"
                  :key="t.id"
                  type="button"
                  class="templates__text-btn"
                  @click="applyTextTemplate(t)"
                >
                  {{ renderText(t) }}
                </button>
              </div>
              <label class="templates__field templates__field--wide">
                <span class="templates__label">{{ field.label }}</span>
                <textarea
                  v-model="values[field.key]"
                  rows="6"
                  :placeholder="field.placeholder"
                ></textarea>
              </label>
            </template>

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
import { formatDocDate } from '@/utils/docs.utils'
import { computed, ref } from 'vue'

const templatesStore = useApplicationTemplates()

const selected = ref(null)
const values = ref({})
const employeeFound = ref(true)
const fileName = ref('')
const isLoading = ref(false)

// Сначала то, что пользователь заполняет сам, ниже — подставленное автоматически
const groups = computed(() =>
  selected.value
    ? [
        { title: 'Заполните', fields: selected.value.fields },
        { title: 'Заполнено автоматически', fields: HEADER_FIELDS },
      ]
    : []
)

// Текст заготовки с подставленными датами (или прочерками, пока даты не выбраны)
const renderText = (template) =>
  template.text
    .replaceAll(
      '{dateFrom}',
      values.value.dateFrom
        ? formatDocDate(values.value.dateFrom)
        : '__.__.____'
    )
    .replaceAll(
      '{dateTo}',
      values.value.dateTo ? formatDocDate(values.value.dateTo) : '__.__.____'
    )

const applyTextTemplate = (template) => {
  values.value[selected.value.textField] = renderText(template)
}

const select = async (template) => {
  selected.value = template
  isLoading.value = true
  try {
    const result = await templatesStore.buildValues(template)
    values.value = result.values
    employeeFound.value = result.employeeFound
    fileName.value = result.fileName ?? ''
  } finally {
    isLoading.value = false
  }
}

const onSubmit = async () => {
  try {
    await templatesStore.generate(selected.value, values.value, fileName.value)
  } catch (error) {
    console.error('Ошибка при создании заявления:', error)
    alert('Не удалось сформировать заявление')
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

.templates__text-btn:hover {
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
