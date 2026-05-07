import { getAllUserVacationsByYear } from '@/services/vacation.api'
import {
  getInternalEmployeeDepartments,
  getInternalEmployees,
} from '@/services/reference.api'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const MOCK_EMPLOYEES = [
  {
    user_id: 'd9c43025-1320-11f1-b9f5-be526a40519c',
    full_name: 'Иванов Алексей Петрович',
    position: 'Frontend-разработчик',
    department: 'Разработка',
  },
  {
    user_id: 2,
    full_name: 'Петрова Мария Сергеевна',
    position: 'Backend-разработчик',
    department: 'Разработка',
  },
  {
    user_id: 3,
    full_name: 'Сидоров Дмитрий Игоревич',
    position: 'Fullstack-разработчик',
    department: 'Разработка',
  },
  {
    user_id: 4,
    full_name: 'Козлова Анна Владимировна',
    position: 'UI/UX дизайнер',
    department: 'Дизайн',
  },
  {
    user_id: 5,
    full_name: 'Новиков Артём Олегович',
    position: 'Графический дизайнер',
    department: 'Дизайн',
  },
  {
    user_id: 6,
    full_name: 'Морозова Екатерина Андреевна',
    position: 'HR-менеджер',
    department: 'HR',
  },
  {
    user_id: 7,
    full_name: 'Волков Николай Александрович',
    position: 'Менеджер по подбору',
    department: 'HR',
  },
  {
    user_id: 8,
    full_name: 'Лебедева Ольга Павловна',
    position: 'Бухгалтер',
    department: 'Бухгалтерия',
  },
  {
    user_id: 9,
    full_name: 'Зайцев Игорь Михайлович',
    position: 'Финансовый аналитик',
    department: 'Бухгалтерия',
  },
]

const MOCK_DEPARTMENTS = ['Разработка', 'Дизайн', 'HR', 'Бухгалтерия']

const MOCK_VACATIONS = [
  {
    id: 1,
    userId: 'd9c43025-1320-11f1-b9f5-be526a40519c',
    startDate: '2026-04-03',
    endDate: '2026-04-18',
    status: 'approved',
  },
  {
    id: 2,
    userId: 2,
    startDate: '2026-04-07',
    endDate: '2026-04-20',
    status: 'pending',
  },
  {
    id: 3,
    userId: 3,
    startDate: '2026-04-14',
    endDate: '2026-04-25',
    status: 'approved',
  },
  {
    id: 4,
    userId: 4,
    startDate: '2026-04-01',
    endDate: '2026-04-10',
    status: 'approved',
  },
  {
    id: 5,
    userId: 5,
    startDate: '2026-04-21',
    endDate: '2026-04-30',
    status: 'pending',
  },
  {
    id: 6,
    userId: 6,
    startDate: '2026-04-05',
    endDate: '2026-04-15',
    status: 'rejected',
  },
  {
    id: 7,
    userId: 7,
    startDate: '2026-04-10',
    endDate: '2026-04-24',
    status: 'approved',
  },
  {
    id: 8,
    userId: 8,
    startDate: '2026-04-02',
    endDate: '2026-04-09',
    status: 'approved',
  },
  {
    id: 9,
    userId: 9,
    startDate: '2026-04-16',
    endDate: '2026-04-28',
    status: 'pending',
  },
  {
    id: 10,
    userId: 'd9c43025-1320-11f1-b9f5-be526a40519c',
    startDate: '2026-02-10',
    endDate: '2026-02-20',
    status: 'approved',
  },
  {
    id: 11,
    userId: 3,
    startDate: '2026-06-01',
    endDate: '2026-06-14',
    status: 'pending',
  },
  {
    id: 12,
    userId: 5,
    startDate: '2026-07-07',
    endDate: '2026-07-21',
    status: 'approved',
  },
]

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
      const normalized = {
        ...employee,
        user_id: employee.user_id ?? employee.id,
      }
      const departmentName = normalized.department || 'Без отдела'
      if (!groupedByDept[departmentName]) {
        groupedByDept[departmentName] = {
          department: departmentName,
          employees: [],
        }
      }
      groupedByDept[departmentName].employees.push(normalized)
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
          : MOCK_VACATIONS

      employees.value =
        employeesResult.status === 'fulfilled'
          ? normalizeEmployees(employeesResult.value)
          : normalizeEmployees(MOCK_EMPLOYEES)

      departments.value =
        departmentsResult.status === 'fulfilled'
          ? normalizeDepartments(departmentsResult.value)
          : MOCK_DEPARTMENTS
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
