import { getAllUserVacationsByYear } from '@/services/vacation.api'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const useVacationOther = defineStore('vacation-other', () => {
  const employees = [
    {
      department: 'IT-отдел',
      employees: [
        {
          user_id: '122d844d-b3be-42d9-8b5b-8a0058edb2d8',
          full_name: 'Степанов Степан Александрович',
          company: 'ООО "Строй технологии"',
          position: 'Инженер-программист',
          department: 'IT-отдел',
          director: 'Степановский Виктор Викторович',
          director_position: 'Директор',
        },
        {
          user_id: '9768155a-b96c-42cb-8e74-a22d523b4a17',
          full_name: 'Белов Михаил Иванович',
          company: 'ООО "Строй технологии"',
          position: 'Инженер-программист',
          department: 'IT-отдел',
          director: 'Степановский Виктор Викторович',
          director_position: 'Директор',
        },
      ],
    },
    {
      department: 'Отдел проектирования',
      employees: [
        {
          user_id: '4f044b23-fa36-4266-942e-0c8ef30d3977',
          full_name: 'Касевич Наталья Сергеевна',
          company: 'ООО "Строй технологии"',
          position: 'Инженер-проектировщик',
          department: 'Отдел проектирования',
          director: 'Степановский Виктор Викторович',
          director_position: 'Директор',
        },
        {
          user_id: '8c45a975-d200-4270-81e1-f29ba4ac7471',
          full_name: 'Патраков Кирилл Иванович',
          company: 'ООО "Строй технологии"',
          position: 'Техник-проектировщик',
          department: 'Отдел проектирования',
          director: 'Степановский Виктор Викторович',
          director_position: 'Директор',
        },
        {
          user_id: '1d0a72bc-211e-4d47-9c5f-d6b3dd766533',
          full_name: 'Омельченко Аделина Юрьевна',
          company: 'ООО "Строй технологии"',
          position: 'Техник-проектировщик',
          department: 'Отдел проектирования',
          director: 'Степановский Виктор Викторович',
          director_position: 'Директор',
        },
        {
          user_id: 'cd39078b-22fe-4af9-aa54-6a53a9ec8f02',
          full_name: 'Мишукова Кристина',
          company: 'ООО "Строй технологии"',
          position: 'Техник-проектировщик',
          department: 'Отдел проектирования',
          director: 'Степановский Виктор Викторович',
          director_position: 'Директор',
        },
      ],
    },
  ]

  const departments = ['IT-отдел', 'Отдел проектирования']

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

  // Плоский список для поиска и других операций
  const allEmployeesFlat = computed(() =>
    employees.flatMap((dept) => dept.employees)
  )

  // Отфильтрованный плоский список
  const filteredEmployeesFlat = computed(() => {
    const searchTerm = filters.value.search
      ? filters.value.search.toLowerCase()
      : ''

    return allEmployeesFlat.value.filter((emp) => {
      // Фильтр по отделу
      if (
        filters.value.department !== 'all' &&
        emp.department !== filters.value.department
      )
        return false

      // Фильтр по поиску
      if (searchTerm && !emp.full_name.toLowerCase().includes(searchTerm))
        return false

      return true
    })
  })

  // Сгруппированный результат (если нужна именно группировка)
  const filteredEmployeesGrouped = computed(() => {
    const groupedByDept = {}

    filteredEmployeesFlat.value.forEach((emp) => {
      if (!groupedByDept[emp.department]) {
        groupedByDept[emp.department] = {
          department: emp.department,
          employees: [],
        }
      }
      groupedByDept[emp.department].employees.push(emp)
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

  async function initialFetch() {
    isLoading.value = true
    vacations.value = await getAllUserVacationsByYear(filters.value.year)
    isLoading.value = false
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
