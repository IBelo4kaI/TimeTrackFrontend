<template>
  <section v-if="store.allowed" class="vacation-balance">
    <div class="balance-toolbar">
      <SelectUI class="year-filter" v-model="store.year" :options="years" variant="line" align="center" />
      <InputUi class="employee-filter" v-model="search" label="Поиск по ФИО" placeholder="Поиск по ФИО" />
      <SelectUI v-if="store.departments.length" v-model="department" variant="line" :options="departmentOptions" />
      <SelectUI class="mobile-sort" v-model="sort" label="Сортировка" :options="sortOptions" />
    </div>
    <div v-if="store.error" class="error-state" role="alert">
      <p>{{ store.error }}</p>
      <ButtonUI @click="store.fetchBalances">Повторить</ButtonUI>
    </div>
    <template v-else>
      <p v-if="store.departmentWarning" role="status">{{ store.departmentWarning }}</p>
      <template v-if="store.loaded">
        <p class="summary-caption">Сводка по всем загруженным сотрудникам за {{ store.year }} год, без учёта поиска и фильтра отдела.</p>
        <div class="summary">
          <CardStatistics :value="store.summary.count" label="Сотрудников" icon="fa-regular fa-users" />
          <CardStatistics :value="store.summary.used" label="Утверждено дней" icon="fa-regular fa-calendar" value-variant="warn" />
          <CardStatistics :value="store.summary.pending" label="Ожидает согласования" icon="fa-regular fa-clock" />
          <CardStatistics :value="store.summary.free" label="Сумма остатков" icon="fa-regular fa-check-circle" value-variant="success" />
        </div>
      </template>
      <AppTable
        :headers="headers" :rows="filteredRows" row-key="userId" :loading="store.loading"
        :sort-by="sortBy" :sort-dir="sortDir" @sort-change="setSort"
        :empty-text="store.rows.length ? 'Сотрудники не найдены по выбранным фильтрам' : 'Нет сотрудников за выбранный год'"
      >
        <template #cell-free="{ row }">
          <div class="balance-value">
            <Badge :type="row.free === 0 ? 'destruct' : row.free <= 7 ? 'warn' : 'success'">{{ row.free }}</Badge>
            <Badge v-if="row.excess > 0" type="warn">Перерасход: {{ row.excess }}</Badge>
          </div>
        </template>
      </AppTable>
    </template>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppTable from '@/components/AppTable.vue'
import InputUi from '@/components/InputUi.vue'
import SelectUI from '@/components/SelectUI.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import Badge from '@/components/Badge.vue'
import CardStatistics from '@/components/CardStatistics.vue'
import { useVacationBalanceStore } from '@/stores/vacationBalance'
import { useUserStore } from '@/stores/user'

const store = useVacationBalanceStore()
const userStore = useUserStore()
const years = computed(() => [store.year - 1, store.year, store.year + 1]
  .filter((year) => year >= 1 && year <= 9999))
const search = ref('')
const department = ref('all')
const sortBy = ref('fullName')
const sortDir = ref('asc')
const sortOptions = [
  { value: 'fullName:asc', label: 'ФИО: А–Я' },
  { value: 'fullName:desc', label: 'ФИО: Я–А' },
  { value: 'free:asc', label: 'Остаток: по возрастанию' },
  { value: 'free:desc', label: 'Остаток: по убыванию' },
]
const sort = computed({
  get: () => `${sortBy.value}:${sortDir.value}`,
  set: (value) => { [sortBy.value, sortDir.value] = value.split(':') },
})
const headers = [
  { valueKey: 'fullName', title: 'Сотрудник', sortable: true },
  { valueKey: 'total', title: 'Годовая норма' },
  { valueKey: 'used', title: 'Утверждено дней' },
  { valueKey: 'pending', title: 'Ожидает согласования' },
  { valueKey: 'free', title: 'Остаток', sortable: true },
]
const departmentOptions = computed(() => [
  { value: 'all', label: 'Все отделы' },
  ...store.departments.map((value) => ({ value, label: value })),
])
const filteredRows = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('ru')
  return store.rows.filter((row) => row.fullName.toLocaleLowerCase('ru').includes(term)
    && (department.value === 'all' || row.department === department.value))
    .sort((a, b) => {
      const byName = a.fullName.localeCompare(b.fullName, 'ru')
      const comparison = sortBy.value === 'free' ? a.free - b.free || byName : byName
      return sortDir.value === 'asc' ? comparison : -comparison
    })
})
function setSort(state) {
  sortBy.value = state.sortBy
  sortDir.value = state.sortDir
}
watch([() => store.year, () => userStore.user?.id, () => store.allowed], () => {
  search.value = ''
  department.value = 'all'
  store.fetchBalances()
}, { immediate: true })
watch(() => store.departments, (items) => {
  if (!items.includes(department.value)) department.value = 'all'
})
onBeforeUnmount(store.clear)
</script>

<style scoped>
.vacation-balance { display: flex; flex-direction: column; gap: var(--padding-secondary); width: 100%; min-width: 0; }
.balance-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}
.year-filter { width: 8rem; }
.employee-filter { flex: 1; min-width: 14rem; max-width: 24rem; }
.balance-toolbar :deep(.input-label) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.mobile-sort { display: none; }
.summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: calc(var(--padding-secondary) / 2); }
.summary-caption { margin: 0; color: var(--muted-text); }
.balance-value { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.error-state { padding: var(--padding-secondary); border: 1px solid var(--border-color); border-radius: var(--border-radius); }
@media (max-width: 768px) {
  .mobile-sort { display: block; }
  .summary { grid-template-columns: 1fr; }
  .balance-toolbar { flex-direction: column; align-items: stretch; }
  .year-filter, .employee-filter { width: 100%; min-width: 0; max-width: none; }
}
</style>
