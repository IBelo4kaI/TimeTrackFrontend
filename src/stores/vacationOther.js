import { getAllUserVacationsByYear } from '@/services/vacation.api'
import {
  getInternalEmployeeDepartments,
  getInternalEmployees,
} from '@/services/reference.api'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const useVacationOther = defineStore('vacation-other', () => {
  const employees = ref([])
  const departments = ref([])

  const filters = ref({
    department: 'all',
    status: 'all',
    month: 2,
    year: 2026,
    viewMode: 'month',
    search: '',
  })

  const isLoading = ref(false)

  const vacations = ref([])

  const allEmployeesFlat = computed(() =>
    employees.value.flatMap((dept) =>
      Array.isArray(dept?.employees) ? dept.employees : []
    )
  )

  const filteredEmployeesFlat = computed(() => {
    const searchTerm = filters.value.search
      ? filters.value.search.toLowerCase()
      : ''

    return allEmployeesFlat.value.filter((emp) => {
      if (
        filters.value.department !== 'all' &&
        emp.department !== filters.value.department
      )
        return false

      if (
        searchTerm &&
        !(emp?.full_name || '').toLowerCase().includes(searchTerm)
      )
        return false

      return true
    })
  })

  const filteredEmployeesGrouped = computed(() => {
    const groupedByDept = {}

    filteredEmployeesFlat.value.forEach((emp) => {
      const departmentName = emp?.department || 'Без отдела'

      if (!groupedByDept[departmentName]) {
        groupedByDept[departmentName] = {
          department: departmentName,
          employees: [],
        }
      }
      groupedByDept[departmentName].employees.push(emp)
    })

    return Object.values(groupedByDept)
  })

  const filteredVacations = computed(() =>
    vacations.value.filter((v) => {
      if (filters.value.status !== 'all' && v.status !== filters.value.status)
        return false

      return true
    })
  )

  const normalizeEmployees = (response) => {
    if (!Array.isArray(response)) return []

    if (response.every((item) => Array.isArray(item?.employees))) {
      return response
    }

    const groupedByDept = {}
    response.forEach((employee) => {
      const departmentName = employee.department || 'Без отдела'
      if (!groupedByDept[departmentName]) {
        groupedByDept[departmentName] = {
          department: departmentName,
          employees: [],
        }
      }
      groupedByDept[departmentName].employees.push(employee)
    })

    return Object.values(groupedByDept)
  }

  const normalizeDepartments = (response) => {
    if (!Array.isArray(response)) return []

    return response
      .map((item) => (typeof item === 'string' ? item : item?.department))
      .filter((name) => name != null && name !== '')
  }

  async function initialFetch() {
    isLoading.value = true
    try {
      const [vacationsResult, employeesResult, departmentsResult] =
        await Promise.allSettled([
          getAllUserVacationsByYear(filters.value.year),
          getInternalEmployees(),
          getInternalEmployeeDepartments(),
        ])

      vacations.value =
        vacationsResult.status === 'fulfilled' &&
        Array.isArray(vacationsResult.value)
          ? vacationsResult.value
          : []

      employees.value =
        employeesResult.status === 'fulfilled'
          ? normalizeEmployees(employeesResult.value)
          : []

      departments.value =
        departmentsResult.status === 'fulfilled'
          ? normalizeDepartments(departmentsResult.value)
          : []
    } finally {
      isLoading.value = false
    }
  }

  function updateFilters(payload) {
    filters.value = { ...filters.value, ...payload }
  }

  function resetFilters() {
    filters.value.department = 'all'
    filters.value.status = 'all'
    filters.value.search = ''
  }

  watch(
    () => filters.value.year,
    async () => {
      await initialFetch()
    }
  )

  return {
    filters,
    allEmployeesFlat,
    filteredEmployeesFlat,
    filteredEmployeesGrouped,
    filteredVacations,
    updateFilters,
    resetFilters,
    initialFetch,
    employees,
    departments,
    isLoading,
  }
})
