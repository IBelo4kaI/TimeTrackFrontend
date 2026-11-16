import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getVacationBalances } from '@/services/vacation.api'
import { getInternalEmployees } from '@/services/internalEmployees.api'
import { getSelfFullName } from '@/utils/user.utils'
import { useUserStore } from '@/stores/user'

export const useVacationBalanceStore = defineStore('vacation-balance', () => {
  const userStore = useUserStore()
  const year = ref(new Date().getFullYear())
  const balances = ref([])
  const departmentsByUser = ref({})
  const departmentWarning = ref('')
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)
  const allowed = computed(() => !!userStore.user?.id && userStore.hasPermission('vacation.all', 'read'))
  let requestId = 0

  function clear() {
    requestId++
    balances.value = []
    departmentsByUser.value = {}
    departmentWarning.value = ''
    loading.value = false
    loaded.value = false
    error.value = ''
  }

  watch([() => userStore.user?.id, allowed], clear, { flush: 'sync' })

  async function fetchBalances() {
    clear()
    if (!allowed.value) return
    const selectedYear = Number(year.value)
    if (!Number.isInteger(selectedYear) || selectedYear < 1 || selectedYear > 9999) {
      error.value = 'Укажите год от 1 до 9999'
      return
    }
    const id = requestId
    loading.value = true
    try {
      const [rows, employees] = await Promise.allSettled([
        getVacationBalances(selectedYear),
        getInternalEmployees(),
      ])
      if (id !== requestId || !allowed.value) return
      if (rows.status === 'rejected') throw rows.reason
      if (!Array.isArray(rows.value)) throw new Error('Некорректный ответ баланса отпусков')
      balances.value = rows.value
      if (employees.status === 'fulfilled' && Array.isArray(employees.value)) {
        const mapping = {}
        employees.value.forEach((item) => {
          const list = Array.isArray(item?.employees) ? item.employees : [item]
          list.forEach((employee) => {
            const userId = employee?.user_id ?? employee?.id
            const department = employee?.department || (Array.isArray(item?.employees) ? item.department : '')
            if (userId && typeof department === 'string' && department) mapping[userId] = department
          })
        })
        departmentsByUser.value = mapping
      } else {
        departmentWarning.value = 'Справочник отделов недоступен. Фильтр по отделу отключён.'
      }
      loaded.value = true
    } catch (cause) {
      if (id === requestId) {
        balances.value = []
        error.value = cause.message || 'Не удалось загрузить баланс отпусков'
      }
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  const rows = computed(() => balances.value.map((row) => ({
    ...row,
    fullName: getSelfFullName(row) || row.userId,
    department: departmentsByUser.value[row.userId] || '',
  })))
  const departments = computed(() => [...new Set(rows.value.map((row) => row.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')))
  const summary = computed(() => balances.value.reduce((total, row) => ({
    count: total.count + 1,
    used: total.used + row.used,
    pending: total.pending + row.pending,
    free: total.free + row.free,
  }), { count: 0, used: 0, pending: 0, free: 0 }))

  return { year, rows, departments, summary, loading, error, loaded, allowed, departmentWarning, fetchBalances, clear }
})
