<template>
  <div class="receipt-category-settings">
    <AppTable :headers="categoryHeaders" :rows="categoryRows" :loading="isLoadingCategories" row-key="id">
      <template #toolbar>
        <div class="settings-title">Категории чеков</div>
        <div class="spacer"></div>
        <ButtonUI @click="openAddCategoryModal">Добавить категорию</ButtonUI>
      </template>

      <template #cell-isSystem="{ value }">
        <Badge :type="value ? 'muted' : 'success'">
          {{ value ? 'Системная' : 'Своя' }}
        </Badge>
      </template>
    </AppTable>

    <AppTable :headers="keywordHeaders" :rows="keywordRows" :loading="isLoadingKeywords" row-key="keyword">
      <template #toolbar>
        <div class="settings-title">Ключевые слова</div>
        <div class="spacer"></div>
        <ButtonUI @click="openAddKeywordModal">Добавить слово</ButtonUI>
      </template>

      <template #cell-isSystem="{ value }">
        <Badge :type="value ? 'muted' : 'success'">
          {{ value ? 'Системное' : 'Своё' }}
        </Badge>
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import {
  createReceiptCategoryKeyword,
  getReceiptCategoryKeywords,
} from '@/services/receipt.api'
import { useReceiptStore } from '@/stores/receipt'
import { useUniversalModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { computed, onMounted, ref } from 'vue'

const receiptStore = useReceiptStore()
const modalStore = useUniversalModalStore()
const notificationStore = useNotificationStore()

const isLoadingCategories = ref(false)
const isLoadingKeywords = ref(false)
const keywords = ref([])

const categoryHeaders = [
  { valueKey: 'name', title: 'Название' },
  { valueKey: 'isSystem', title: 'Источник' },
]

const keywordHeaders = [
  { valueKey: 'keyword', title: 'Слово / фраза' },
  { valueKey: 'categoryName', title: 'Категория' },
  { valueKey: 'isSystem', title: 'Источник' },
]

const categoryRows = computed(() => receiptStore.categories)

const keywordRows = computed(() =>
  keywords.value.map((k) => ({
    ...k,
    categoryName: receiptStore.getCategoryLabel(k.categoryId) ?? '—',
  }))
)

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
    notificationStore.addNotification('Не удалось загрузить ключевые слова', 'error')
  } finally {
    isLoadingKeywords.value = false
  }
}

function openAddCategoryModal() {
  modalStore.open({
    title: 'Новая категория',
    submitButtonText: 'Добавить',
    submittingText: 'Добавление...',
    fields: [{ name: 'name', type: 'text', label: 'Название', required: true, value: '' }],
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

onMounted(async () => {
  await loadCategories()
  await loadKeywords()
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
</style>
