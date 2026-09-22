<template>
  <div class="receipt-category-settings">
    <AppTable
      :headers="categoryHeaders"
      :rows="pagedCategoryRows"
      :loading="isLoadingCategories"
      row-key="id"
      pagination
      :current-page="categoryPage"
      :page-size="PAGE_SIZE"
      :total="categoryRows.length"
      @update:current-page="categoryPage = $event"
    >
      <template #toolbar>
        <div class="settings-title">Категории чеков</div>
        <InputUi v-model="categorySearch" placeholder="Поиск" class="search-input">
          <template #prefix><i class="fa-regular fa-magnifying-glass"></i></template>
        </InputUi>
        <div class="spacer"></div>
        <ButtonUI @click="openAddCategoryModal">Добавить категорию</ButtonUI>
      </template>

      <template #cell-isSystem="{ value }">
        <Badge :type="value ? 'muted' : 'success'">
          {{ value ? 'Системная' : 'Своя' }}
        </Badge>
      </template>

      <template #actions="{ row }">
        <ButtonUI
          type="muted"
          icon="fa-regular fa-pen"
          v-tooltip="'Переименовать категорию'"
          @click="openEditCategoryModal(row)"
        />
      </template>
    </AppTable>

    <AppTable
      :headers="keywordHeaders"
      :rows="pagedKeywordRows"
      :loading="isLoadingKeywords"
      row-key="keyword"
      pagination
      :current-page="keywordPage"
      :page-size="PAGE_SIZE"
      :total="keywordRows.length"
      @update:current-page="keywordPage = $event"
    >
      <template #toolbar>
        <div class="settings-title">Ключевые слова</div>
        <InputUi v-model="keywordSearch" placeholder="Поиск" class="search-input">
          <template #prefix><i class="fa-regular fa-magnifying-glass"></i></template>
        </InputUi>
        <div class="spacer"></div>
        <ButtonUI @click="openAddKeywordModal">Добавить слово</ButtonUI>
      </template>

      <template #cell-isSystem="{ value }">
        <Badge :type="value ? 'muted' : 'success'">
          {{ value ? 'Системное' : 'Своё' }}
        </Badge>
      </template>
    </AppTable>

    <AppTable
      :headers="merchantHeaders"
      :rows="pagedMerchantRows"
      :loading="isLoadingMerchants"
      row-key="inn"
      pagination
      :current-page="merchantPage"
      :page-size="PAGE_SIZE"
      :total="merchantRows.length"
      @update:current-page="merchantPage = $event"
    >
      <template #toolbar>
        <div class="settings-title">Продавцы</div>
        <InputUi v-model="merchantSearch" placeholder="Поиск" class="search-input">
          <template #prefix><i class="fa-regular fa-magnifying-glass"></i></template>
        </InputUi>
        <div class="spacer"></div>
      </template>

      <template #cell-source="{ value }">
        <Badge :type="value === 'user_override' ? 'success' : 'muted'">
          {{ sourceLabel(value) }}
        </Badge>
      </template>

      <template #actions="{ row }">
        <ButtonUI
          type="muted"
          icon="fa-regular fa-pen"
          v-tooltip="'Изменить категорию продавца'"
          @click="openEditMerchantModal(row)"
        />
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import {
  createReceiptCategoryKeyword,
  getReceiptCategoryKeywords,
  getReceiptCategoryMerchants,
  updateReceiptCategoryMerchant,
} from '@/services/receipt.api'
import { useReceiptStore } from '@/stores/receipt'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { nullString } from '@/utils/receipt.utils'
import { computed, onMounted, ref, watch } from 'vue'

const receiptStore = useReceiptStore()
const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

const isLoadingCategories = ref(false)
const isLoadingKeywords = ref(false)
const isLoadingMerchants = ref(false)
const keywords = ref([])
const merchants = ref([])

// Пагинация — AppTable сама не режет rows, ждёт уже готовый срез страницы
// (см. AppTable.vue: pagination/currentPage/pageSize/total только рисуют
// контролы и считают total, слайс — забота родителя).
const PAGE_SIZE = 8
const categoryPage = ref(1)
const keywordPage = ref(1)
const merchantPage = ref(1)

const categorySearch = ref('')
const keywordSearch = ref('')
const merchantSearch = ref('')

// Поиск сбрасывает текущую страницу — иначе после фильтрации легко
// оказаться на несуществующей (пустой) странице.
watch(categorySearch, () => (categoryPage.value = 1))
watch(keywordSearch, () => (keywordPage.value = 1))
watch(merchantSearch, () => (merchantPage.value = 1))

function paginate(rows, page) {
  const start = (page - 1) * PAGE_SIZE
  return rows.slice(start, start + PAGE_SIZE)
}

function matches(search, ...values) {
  const term = search.trim().toLowerCase()
  if (!term) return true
  return values.some((v) => v && String(v).toLowerCase().includes(term))
}

const categoryHeaders = [
  { valueKey: 'name', title: 'Название' },
  { valueKey: 'isSystem', title: 'Источник' },
]

const keywordHeaders = [
  { valueKey: 'keyword', title: 'Слово / фраза' },
  { valueKey: 'categoryName', title: 'Категория' },
  { valueKey: 'isSystem', title: 'Источник' },
]

const merchantHeaders = [
  { valueKey: 'sellerDisplay', title: 'Продавец' },
  { valueKey: 'categoryName', title: 'Категория' },
  { valueKey: 'source', title: 'Откуда' },
]

const categoryRows = computed(() =>
  receiptStore.categories.filter((c) => matches(categorySearch.value, c.name))
)
const pagedCategoryRows = computed(() =>
  paginate(categoryRows.value, categoryPage.value)
)

const keywordRows = computed(() =>
  keywords.value
    .map((k) => ({
      ...k,
      categoryName: receiptStore.getCategoryLabel(k.categoryId) ?? '—',
    }))
    .filter((k) => matches(keywordSearch.value, k.keyword, k.categoryName))
)
const pagedKeywordRows = computed(() =>
  paginate(keywordRows.value, keywordPage.value)
)

const merchantRows = computed(() =>
  merchants.value
    .map((m) => ({
      ...m,
      sellerDisplay: nullString(m.sellerName) || `ИНН ${m.inn}`,
      categoryName: receiptStore.getCategoryLabel(m.categoryId) ?? '—',
    }))
    .filter((m) =>
      matches(merchantSearch.value, m.sellerDisplay, m.inn, m.categoryName)
    )
)
const pagedMerchantRows = computed(() =>
  paginate(merchantRows.value, merchantPage.value)
)

const SOURCE_LABELS = {
  seed: 'Начальный список',
  keyword_match: 'Определено автоматически',
  user_override: 'Изменено вручную',
}

function sourceLabel(source) {
  return SOURCE_LABELS[source] ?? source
}

function errorMessage(err, fallback) {
  return err?.response?.data?.error ?? fallback
}

async function loadCategories() {
  isLoadingCategories.value = true
  try {
    await receiptStore.fetchCategories()
  } catch {
    notificationStore.addNotification('Не удалось загрузить категории', 'error')
  } finally {
    isLoadingCategories.value = false
  }
}

async function loadKeywords() {
  isLoadingKeywords.value = true
  try {
    keywords.value = (await getReceiptCategoryKeywords()) ?? []
  } catch {
    notificationStore.addNotification(
      'Не удалось загрузить ключевые слова',
      'error'
    )
  } finally {
    isLoadingKeywords.value = false
  }
}

async function loadMerchants() {
  isLoadingMerchants.value = true
  try {
    merchants.value = (await getReceiptCategoryMerchants()) ?? []
  } catch {
    notificationStore.addNotification(
      'Не удалось загрузить словарь продавцов',
      'error'
    )
  } finally {
    isLoadingMerchants.value = false
  }
}

function openAddCategoryModal() {
  modalStore.open({
    title: 'Новая категория',
    submitButtonText: 'Добавить',
    submittingText: 'Добавление...',
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Название',
        required: true,
        value: '',
      },
    ],
    onSubmit: async (data) => {
      try {
        await receiptStore.addCategory(data.name)
      } catch (err) {
        notificationStore.addNotification(
          errorMessage(err, 'Не удалось добавить категорию'),
          'error'
        )
        throw err
      }
      notificationStore.addNotification('Категория добавлена', 'success')
    },
  })
}

function openEditCategoryModal(category) {
  modalStore.open({
    title: 'Переименовать категорию',
    submitButtonText: 'Сохранить',
    submittingText: 'Сохранение...',
    fields: [
      {
        name: 'name',
        type: 'text',
        label: 'Название',
        required: true,
        value: category.name,
      },
    ],
    onSubmit: async (data) => {
      try {
        await receiptStore.renameCategory(category.id, data.name)
      } catch (err) {
        notificationStore.addNotification(
          errorMessage(err, 'Не удалось переименовать категорию'),
          'error'
        )
        throw err
      }
      notificationStore.addNotification('Категория переименована', 'success')
    },
  })
}

function openAddKeywordModal() {
  modalStore.open({
    title: 'Новое ключевое слово',
    submitButtonText: 'Добавить',
    submittingText: 'Добавление...',
    fields: [
      {
        name: 'keyword',
        type: 'text',
        label: 'Слово или фраза',
        hint: 'В нормальной форме, нижний регистр — например "молоко", а не "молока"',
        required: true,
        value: '',
      },
      {
        name: 'categoryId',
        type: 'select',
        label: 'Категория',
        required: true,
        options: receiptStore.categoryOptions,
        value: '',
      },
    ],
    onSubmit: async (data) => {
      try {
        const created = await createReceiptCategoryKeyword(
          data.keyword,
          Number(data.categoryId)
        )
        keywords.value.push(created)
      } catch (err) {
        notificationStore.addNotification(
          errorMessage(err, 'Не удалось добавить ключевое слово'),
          'error'
        )
        throw err
      }
      notificationStore.addNotification('Ключевое слово добавлено', 'success')
    },
  })
}

function openEditMerchantModal(merchant) {
  modalStore.open({
    title: merchant.sellerDisplay,
    submitButtonText: 'Сохранить',
    submittingText: 'Сохранение...',
    fields: [
      {
        name: 'categoryId',
        type: 'select',
        label: 'Категория',
        required: true,
        options: receiptStore.categoryOptions,
        value: merchant.categoryId,
      },
    ],
    onSubmit: async (data) => {
      let result
      try {
        result = await updateReceiptCategoryMerchant(
          merchant.inn,
          Number(data.categoryId)
        )
      } catch (err) {
        notificationStore.addNotification(
          errorMessage(err, 'Не удалось изменить категорию продавца'),
          'error'
        )
        throw err
      }
      // merchant тут — строка из вычисляемого merchantRows (новый объект на
      // каждый пересчёт), мутировать её бессмысленно — правим источник,
      // merchants.value, по ИНН.
      const source = merchants.value.find((m) => m.inn === merchant.inn)
      if (source) {
        source.categoryId = Number(data.categoryId)
        source.source = 'user_override'
      }
      notificationStore.addNotification(
        result.updatedReceipts
          ? `Категория обновлена — переставлена на ${result.updatedReceipts} уже сохранённых чеках`
          : 'Категория обновлена',
        'success'
      )
    },
  })
}

onMounted(async () => {
  await loadCategories()
  await loadKeywords()
  await loadMerchants()
})
</script>

<style scoped>
.receipt-category-settings {
  display: flex;
  flex-direction: column;
  gap: var(--gap-primary);
}

.settings-title {
  display: flex;
  align-items: center;
  font-size: 1.14rem;
  font-weight: 600;
  color: var(--text);
}

.spacer {
  flex: 1;
}

.search-input {
  width: 16rem;
}
</style>
