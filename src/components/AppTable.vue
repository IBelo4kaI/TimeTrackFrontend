<template>
   <div class="table-wrapper">
      <div v-if="$slots.toolbar" class="table-toolbar">
         <slot name="toolbar" />
      </div>

      <div class="table-scroll">
         <table class="table">
            <thead>
               <tr>
                  <th
                     v-for="header in headers"
                     :key="headerKey(header.valueKey)"
                     :class="[
                        'th',
                        header.align ? `align-${header.align}` : 'align-left',
                        header.sortable ? 'sortable' : '',
                     ]"
                     @click="
                        header.sortable
                           ? toggleSort(header.valueKey)
                           : undefined
                     "
                  >
                     <span class="th-content">
                        {{ header.title }}
                        <span v-if="header.sortable" class="sort-icon">
                           <svg
                              v-if="sortBy === headerKey(header.valueKey)"
                              :class="[
                                 'sort-arrow',
                                 sortDir === 'asc' ? 'asc' : 'desc',
                              ]"
                              viewBox="0 0 10 6"
                              fill="none"
                           >
                              <path
                                 d="M1 1L5 5L9 1"
                                 stroke="currentColor"
                                 stroke-width="1.5"
                                 stroke-linecap="round"
                                 stroke-linejoin="round"
                              />
                           </svg>
                           <svg
                              v-else
                              class="sort-arrow neutral"
                              viewBox="0 0 10 10"
                              fill="none"
                           >
                              <path
                                 d="M5 1V9M5 1L2 4M5 1L8 4"
                                 stroke="currentColor"
                                 stroke-width="1.5"
                                 stroke-linecap="round"
                                 stroke-linejoin="round"
                                 opacity="0.4"
                              />
                           </svg>
                        </span>
                     </span>
                  </th>
                  <th
                     v-if="$slots.actions"
                     class="th align-right actions-header"
                  >
                     <span class="th-content">Действия</span>
                  </th>
               </tr>
            </thead>

            <tbody>
               <tr v-if="loading">
                  <td
                     :colspan="headers.length + ($slots.actions ? 1 : 0)"
                     class="state-cell"
                  >
                     <div class="loading-state">
                        <loader />
                     </div>
                  </td>
               </tr>

               <tr v-else-if="rows.length === 0">
                  <td
                     :colspan="headers.length + ($slots.actions ? 1 : 0)"
                     class="state-cell"
                  >
                     <div class="empty-state">
                        <svg viewBox="0 0 40 40" fill="none" class="empty-icon">
                           <rect
                              x="4"
                              y="8"
                              width="32"
                              height="24"
                              rx="3"
                              stroke="currentColor"
                              stroke-width="1.5"
                           />
                           <path
                              d="M4 14h32"
                              stroke="currentColor"
                              stroke-width="1.5"
                           />
                           <path
                              d="M12 20h8M12 25h6"
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linecap="round"
                           />
                        </svg>
                        <span>{{ emptyText }}</span>
                     </div>
                  </td>
               </tr>

               <tr
                  v-else
                  v-for="(row, rowIndex) in rows"
                  :key="rowKey ? String(getNestedValue(row, rowKey)) : rowIndex"
                  :class="[
                     'tr',
                     clickable ? 'tr--clickable' : '',
                     selectedRow === rowIndex ? 'tr--selected' : '',
                  ]"
                  @click="clickable ? handleRowClick(row, rowIndex) : undefined"
               >
                  <td
                     v-for="header in headers"
                     :key="headerKey(header.valueKey)"
                     :class="[
                        'td',
                        header.align ? `align-${header.align}` : 'align-left',
                     ]"
                  >
                     <slot
                        v-if="$slots[`cell-${headerKey(header.valueKey)}`]"
                        :name="`cell-${headerKey(header.valueKey)}`"
                        :value="getCellValue(row, header.valueKey)"
                        :row="row"
                        :index="rowIndex"
                     />
                     <span v-else class="cell-value">
                        {{
                           formatValue(
                              getCellValue(row, header.valueKey),
                              header
                           )
                        }}
                     </span>
                  </td>

                  <td v-if="$slots.actions" class="td align-right actions-cell">
                     <slot name="actions" :row="row" :index="rowIndex" />
                  </td>
               </tr>
            </tbody>
         </table>
      </div>

      <div v-if="pagination && totalPages > 1" class="pagination">
         <span class="pagination-info">
            {{ (currentPage - 1) * pageSize + 1 }}–{{
               Math.min(currentPage * pageSize, total)
            }}
            из {{ total }}
         </span>
         <div class="pagination-controls">
            <button
               class="page-btn"
               :disabled="currentPage === 1"
               @click="$emit('update:currentPage', currentPage - 1)"
            >
               <svg viewBox="0 0 8 12" fill="none">
                  <path
                     d="M7 1L1 6L7 11"
                     stroke="currentColor"
                     stroke-width="1.5"
                     stroke-linecap="round"
                     stroke-linejoin="round"
                  />
               </svg>
            </button>
            <button
               v-for="page in visiblePages"
               :key="String(page)"
               :class="[
                  'page-btn',
                  'page-number',
                  page === currentPage ? 'active' : '',
                  page === '...' ? 'dots' : '',
               ]"
               :disabled="page === '...'"
               @click="
                  typeof page === 'number'
                     ? $emit('update:currentPage', page)
                     : undefined
               "
            >
               {{ page }}
            </button>
            <button
               class="page-btn"
               :disabled="currentPage === totalPages"
               @click="$emit('update:currentPage', currentPage + 1)"
            >
               <svg viewBox="0 0 8 12" fill="none">
                  <path
                     d="M1 1L7 6L1 11"
                     stroke="currentColor"
                     stroke-width="1.5"
                     stroke-linecap="round"
                     stroke-linejoin="round"
                  />
               </svg>
            </button>
         </div>
      </div>
   </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import Loader from './Loader.vue'

export interface TableHeader {
   valueKey: string | string[]
   title: string
   align?: 'left' | 'center' | 'right'
   sortable?: boolean
   format?: (value: unknown) => string
}

export interface SortState {
   sortBy: string
   sortDir: 'asc' | 'desc'
}

interface Props {
   headers: TableHeader[]
   rows: Record<string, unknown>[]
   rowKey?: string
   loading?: boolean
   emptyText?: string
   clickable?: boolean
   pagination?: boolean
   currentPage?: number
   pageSize?: number
   total?: number
   // Controlled sort state (managed by parent for server-side sorting)
   sortBy?: string
   sortDir?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
   rows: () => [],
   loading: false,
   emptyText: 'Нет данных',
   clickable: false,
   pagination: false,
   currentPage: 1,
   pageSize: 10,
   total: 0,
   sortBy: '',
   sortDir: 'asc',
})

const emit = defineEmits<{
   'row-click': [row: Record<string, unknown>, index: number]
   'update:currentPage': [page: number]
   'update:sortBy': [sortBy: string]
   'update:sortDir': [sortDir: 'asc' | 'desc']
   /** Удобный single-event для отправки на сервер */
   'sort-change': [state: SortState]
}>()

const selectedRow = ref<number | null>(null)

function headerKey(valueKey: string | string[]): string {
   return Array.isArray(valueKey) ? valueKey.join('.') : valueKey
}

function getNestedValue(
   obj: Record<string, unknown>,
   key: string | string[]
): unknown {
   const keys = Array.isArray(key) ? key : key.split('.')
   return keys.reduce((acc: unknown, k) => {
      if (acc && typeof acc === 'object')
         return (acc as Record<string, unknown>)[k]
      return undefined
   }, obj)
}

function getCellValue(
   row: Record<string, unknown>,
   valueKey: string | string[]
): unknown {
   return getNestedValue(row, valueKey)
}

function formatValue(value: unknown, header: TableHeader): string {
   if (header.format) return header.format(value)
   if (value === null || value === undefined) return '—'
   return String(value)
}

function toggleSort(key: string | string[]) {
   const keyStr = headerKey(key)
   const newDir: 'asc' | 'desc' =
      props.sortBy === keyStr && props.sortDir === 'asc' ? 'desc' : 'asc'

   emit('update:sortBy', keyStr)
   emit('update:sortDir', newDir)
   emit('sort-change', { sortBy: keyStr, sortDir: newDir })
   emit('update:currentPage', 1) // сбрасываем страницу при смене сортировки
}

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const visiblePages = computed(() => {
   const pages: (number | string)[] = []
   const total = totalPages.value
   const current = props.currentPage
   if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
   } else {
      pages.push(1)
      if (current > 3) pages.push('...')
      for (
         let i = Math.max(2, current - 1);
         i <= Math.min(total - 1, current + 1);
         i++
      )
         pages.push(i)
      if (current < total - 2) pages.push('...')
      pages.push(total)
   }
   return pages
})

function handleRowClick(row: Record<string, unknown>, index: number) {
   selectedRow.value = index
   emit('row-click', row, index)
}
</script>

<style scoped>
.table-wrapper {
   width: 100%;
   background: var(--foreground);
   border-radius: var(--border-radius);
   border: 1px solid var(--border-color);
   overflow: hidden;
}

.table-toolbar {
   padding: var(--padding-secondary) var(--padding-primary);
   border-bottom: 1px solid var(--border-color);
   display: flex;
   flex-wrap: wrap;
   align-items: center;
   gap: var(--gap-primary, 0.71rem);
}

.table-scroll {
   width: 100%;
   overflow-x: auto;
}

.table {
   width: 100%;
   border-collapse: collapse;
   font-size: 0.875rem;
   color: var(--text);
}

.th {
   padding: var(--padding-secondary) var(--padding-primary);
   background: var(--muted-foreground);
   border-bottom: 1px solid var(--border-color);
   font-weight: 600;
   font-size: 0.8rem;
   color: var(--muted-text);
   white-space: nowrap;
   user-select: none;
   letter-spacing: 0.02em;
}

.th-content {
   display: inline-flex;
   align-items: center;
   gap: var(--gap-secondary);
}

.th.sortable {
   cursor: pointer;
   transition: color 0.15s;
}
.th.sortable:hover {
   color: var(--text);
}

.sort-icon {
   display: inline-flex;
   align-items: center;
   width: 10px;
   height: 10px;
}

.sort-arrow {
   width: 10px;
   height: 10px;
   color: var(--muted-text);
   transition:
      transform 0.2s,
      color 0.15s;
}

.sort-arrow.asc {
   color: var(--accent);
   transform: rotate(180deg);
}
.sort-arrow.desc {
   color: var(--accent);
}

.tr {
   transition: background 0.12s;
   border-bottom: 1px solid var(--border-color);
}

.tr:last-child {
   border-bottom: none;
}
.tr--clickable {
   cursor: pointer;
}
.tr--clickable:hover {
   background: var(--background);
}
.tr--selected {
   background: var(--muted-accent) !important;
}

.td {
   padding: var(--padding-secondary) var(--padding-primary);
   color: var(--text);
   vertical-align: middle;
}

.cell-value {
   display: block;
}

.align-left {
   text-align: left;
}
.align-center {
   text-align: center;
}
.align-right {
   text-align: right;
}

.actions-header,
.actions-cell {
   width: 1px;
   white-space: nowrap;
}

.actions-cell {
   padding-right: var(--padding-primary);
}

.state-cell {
   padding: 3rem var(--padding-primary);
   text-align: center;
}

.loading-state,
.empty-state {
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: 0.75rem;
   color: var(--muted-text);
   font-size: 0.875rem;
}

.empty-icon {
   width: 40px;
   height: 40px;
   color: var(--border-color);
}

.pagination {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: var(--padding-secondary) var(--padding-primary);
   border-top: 1px solid var(--border-color);
   gap: var(--gap-primary);
}

.pagination-info {
   font-size: 0.8rem;
   color: var(--muted-text);
}

.pagination-controls {
   display: flex;
   align-items: center;
   gap: var(--gap-secondary);
}

.page-btn {
   display: inline-flex;
   align-items: center;
   justify-content: center;
   min-width: 2rem;
   height: 2rem;
   padding: 0 0.4rem;
   border: 1px solid var(--border-color);
   border-radius: calc(var(--border-radius) * 0.6);
   background: var(--foreground);
   color: var(--text);
   font-size: 0.8rem;
   cursor: pointer;
   transition:
      background 0.12s,
      border-color 0.12s,
      color 0.12s;
}

.page-btn svg {
   width: 8px;
   height: 12px;
}

.page-btn:hover:not(:disabled):not(.dots) {
   border-color: var(--accent);
   color: var(--accent);
}

.page-btn.active {
   background: var(--accent);
   border-color: var(--accent);
   color: var(--on-accent);
   font-weight: 600;
}

.page-btn:disabled {
   opacity: 0.35;
   cursor: default;
}

.page-btn.dots {
   border-color: transparent;
   background: transparent;
   cursor: default;
   color: var(--muted-text);
}
</style>
