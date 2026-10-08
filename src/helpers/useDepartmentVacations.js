import { getVacationCalendarByYear } from '@/services/vacation.api'
import { getInternalEmployees } from '@/services/reference.api'
import { flattenInternalEmployees } from '@/utils/user.utils'
import { computed, onMounted, ref, watch } from 'vue'

// Насколько близко к выбранному периоду отпуск коллеги считается смежным
const ADJACENT_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

const toTime = (str) => new Date(String(str).slice(0, 10)).getTime()

// Отпуска коллег из того же отдела, что пересекаются с выбранным периодом
// или находятся рядом с ним. Без отдела у сотрудника — пустой список.
export function useDepartmentVacations(userId, startDate, endDate) {
  const employees = ref([])
  const vacationsByYear = ref({}) // year -> vacations[]

  const employee = computed(() =>
    employees.value.find((e) => String(e.user_id) === String(userId.value))
  )
  const department = computed(() => employee.value?.department || '')

  onMounted(async () => {
    try {
      employees.value = flattenInternalEmployees(await getInternalEmployees())
    } catch {
      employees.value = []
    }
  })

  const years = computed(() => {
    if (!startDate.value) return []
    const from = Number(startDate.value.slice(0, 4))
    const to = Number((endDate.value || startDate.value).slice(0, 4))
    return from === to ? [from] : [from, to]
  })

  watch(
    [years, department],
    async ([list, dept]) => {
      if (!dept) return
      await Promise.all(
        list
          .filter((y) => !vacationsByYear.value[y])
          .map(async (year) => {
            try {
              const result = await getVacationCalendarByYear(year)
              vacationsByYear.value[year] = Array.isArray(result) ? result : []
            } catch {
              // без данных просто не показываем смежные отпуска
            }
          })
      )
    },
    { immediate: true }
  )

  const adjacent = computed(() => {
    if (!department.value || !startDate.value) return []

    const names = new Map(
      employees.value
        .filter((e) => e.department === department.value)
        .map((e) => [String(e.user_id), e.full_name])
    )
    const from = toTime(startDate.value) - ADJACENT_DAYS * DAY_MS
    const to = toTime(endDate.value || startDate.value) + ADJACENT_DAYS * DAY_MS

    return years.value
      .flatMap((y) => vacationsByYear.value[y] ?? [])
      .filter(
        (v) =>
          v.status !== 'rejected' &&
          String(v.userId) !== String(userId.value) &&
          names.has(String(v.userId)) &&
          toTime(v.startDate) <= to &&
          toTime(v.endDate) >= from
      )
      .map((v) => ({
        id: v.id,
        name: names.get(String(v.userId)),
        startDate: String(v.startDate).slice(0, 10),
        endDate: String(v.endDate).slice(0, 10),
        status: v.status,
        typeName: v.vacationTypeName,
        color: v.vacationTypeColor,
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  })

  return { department, adjacent }
}
