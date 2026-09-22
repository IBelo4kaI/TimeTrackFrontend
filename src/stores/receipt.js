import {
  createReceipt,
  createReceiptCategory,
  deleteReceipt,
  getAllReceipts,
  getReceiptById,
  getReceiptCategories,
  getReceiptsByUser,
  renameReceiptCategory,
} from '@/services/receipt.api'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { nullInt } from '@/utils/receipt.utils'
import { useUserStore } from './user'

// Отдельное значение фильтра "Без категории" — '' уже занято под "Все
// категории", а category_id IS NULL не выразить обычным числовым id.
export const NO_CATEGORY_FILTER = 'none'

export const useReceiptStore = defineStore('receipt', () => {
  // бэк отдаёт чеки без фильтра по дате — год/месяц фильтруем на фронте
  // (см. filterReceipts), в отличие от vacation, где год уходит в запрос.
  const selectedYear = ref(new Date().getFullYear())
  const selectedMonth = ref(new Date().getMonth() + 1) // null = весь год, иначе 1-12
  const target = ref('my')
  // Фильтр по сотруднику — имеет смысл только при target == 'all', сбрасывается при смене вкладки
  const employeeId = ref('')
  // Фильтр по категории — имеет смысл на обеих вкладках, при смене вкладки не сбрасывается
  const categoryId = ref('')

  // 'createdAt' — когда чек добавлен в систему, 'ticketDate' — дата на самом
  // чеке (может сильно отличаться, если чек добавили не сразу).
  const sortBy = ref('createdAt')

  const receipts = ref([])
  const selectedReceipt = ref(null) // карточка с items, см. fetchReceiptById

  const isLoading = ref(false)
  const userStore = useUserStore()

  const filterReceipts = computed(() => {
    // Фильтр по месяцу/году смотрит на то же поле, что и сортировка — иначе
    // выбор "Август" при сортировке "по дате добавления" фильтровал бы по
    // ticketDate, а не по дате, которую пользователь реально выбирает.
    return receipts.value
      .slice() // sort мутирует массив — копия, чтобы не трогать receipts.value
      .sort((a, b) => new Date(b[sortBy.value]) - new Date(a[sortBy.value]))
      .filter((r) => {
        const date = new Date(r[sortBy.value])
        if (date.getFullYear() != selectedYear.value) return false
        if (selectedMonth.value && date.getMonth() + 1 != selectedMonth.value)
          return false
        if (employeeId.value && r.userId != employeeId.value) return false
        if (categoryId.value === NO_CATEGORY_FILTER) {
          if (nullInt(r.categoryId) != null) return false
        } else if (categoryId.value && nullInt(r.categoryId) != categoryId.value) {
          return false
        }
        return true
      })
  })

  const totalSum = computed(() =>
    filterReceipts.value.reduce((sum, r) => sum + (r.totalSum ?? 0), 0)
  )

  const fetchReceipts = async () => {
    if (target.value == 'all') await fetchAllReceipts()
    else if (target.value == 'my') await fetchMyReceipts()
  }

  /* ================== fetch ================== */
  const fetchMyReceipts = async () => {
    isLoading.value = true
    const list = await getReceiptsByUser(userStore.user.id)

    receipts.value = list ?? []
    isLoading.value = false
  }

  const fetchAllReceipts = async () => {
    isLoading.value = true
    const list = await getAllReceipts()

    receipts.value = list ?? []
    isLoading.value = false
  }

  const fetchReceiptById = async (id) => {
    isLoading.value = true
    const item = await getReceiptById(id)

    selectedReceipt.value = item ?? null
    isLoading.value = false
    return selectedReceipt.value
  }

  /* ================== actions ================== */
  const addReceipt = async (data) => {
    const created = await createReceipt(data)
    receipts.value.unshift(created)
    return created
  }

  const removeReceipt = async (id) => {
    await deleteReceipt(id)
    receipts.value = receipts.value.filter((r) => r.id != id)
    if (selectedReceipt.value?.id == id) selectedReceipt.value = null
  }

  /* ================== категории (см. internal/receipt_category на бэке) ================== */
  // Список маленький (десятки записей) — грузим целиком один раз.
  const categories = ref([])
  let categoriesLoaded = false

  const fetchCategories = async () => {
    if (categoriesLoaded) return
    categories.value = (await getReceiptCategories()) ?? []
    categoriesLoaded = true
  }

  const categoryOptions = computed(() =>
    categories.value.map((c) => ({ value: c.id, label: c.name }))
  )

  const getCategoryLabel = (id) =>
    categories.value.find((c) => c.id == id)?.name ?? null

  const addCategory = async (name) => {
    const created = await createReceiptCategory(name)
    categories.value.push(created)
    categories.value.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    return created
  }

  const renameCategory = async (id, name) => {
    const updated = await renameReceiptCategory(id, name)
    const item = categories.value.find((c) => c.id == id)
    if (item) item.name = updated.name
    categories.value.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }

  watch(target, async () => {
    employeeId.value = ''
    await fetchReceipts()
    if (target.value == 'all') await userStore.userAllFetch()
  })

  return {
    // state
    selectedYear,
    selectedMonth,
    sortBy,
    receipts,
    selectedReceipt,
    isLoading,
    filterReceipts,
    totalSum,
    target,
    employeeId,
    categoryId,
    categories,
    categoryOptions,

    // actions
    fetchReceipts,
    fetchAllReceipts,
    fetchMyReceipts,
    fetchReceiptById,
    addReceipt,
    removeReceipt,
    fetchCategories,
    getCategoryLabel,
    addCategory,
    renameCategory,
  }
})
