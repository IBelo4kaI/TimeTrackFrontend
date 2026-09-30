<template>
  <div class="cards">
    <AppTable
      :headers="headers"
      :rows="rows"
      row-key="id"
      :loading="store.isLoading"
      empty-text="Карты не найдены"
    >
      <template #toolbar>
        <Tabs
          v-if="isAdmin"
          :tabs="targets"
          v-model="store.target"
          type="line"
          class="target-tabs"
        />
        <div class="cards__end">
          <ButtonUI
            v-if="canCreate"
            type="accent"
            icon="fa-regular fa-plus"
            v-tooltip="'Добавить карту'"
            @click="openCreateModal()"
          />
        </div>
      </template>

      <template #cell-cardTitle="{ row }">
        <Badge type="muted" class="cards__open" @click="openCard(row)">
          •••• {{ row.last4 }}
        </Badge>
      </template>

      <template #cell-status="{ value }">
        <Badge :type="value == 'active' ? 'success' : 'destruct'">
          {{ value == 'active' ? 'Активна' : 'Заблокирована' }}
        </Badge>
      </template>

      <template #actions="{ row }">
        <div class="row-actions">
          <ButtonUI
            type="muted-accent"
            icon="fa-regular fa-arrow-up-right-from-square"
            v-tooltip="'Страница карты'"
            @click="openCard(row)"
          />
          <template v-if="canEdit">
            <ButtonUI
              type="muted-accent"
              icon="fa-regular fa-user-plus"
              v-tooltip="'Выдать сотруднику'"
              @click="openAssignModal(row)"
            />
            <ButtonUI
              type="muted-accent"
              icon="fa-regular fa-pen"
              v-tooltip="'Редактировать'"
              @click="openEditModal(row)"
            />
          </template>
          <ButtonUI
            v-if="canDelete"
            type="destructive"
            icon="fa-regular fa-trash-can-xmark"
            v-tooltip="'Удалить карту'"
            @click="confirmDelete(row)"
          />
        </div>
      </template>
    </AppTable>
  </div>
</template>

<script setup>
import AppTable from '@/components/AppTable.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import Tabs from '@/components/Tabs.vue'
import {
  getUserFullName,
  useBusinessCardActions,
} from '@/helpers/businessCard.helpers'
import { useBusinessCardStore } from '@/stores/businessCard'
import { useUserStore } from '@/stores/user'
import { formatMoney } from '@/utils/receipt.utils'
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const store = useBusinessCardStore()
const userStore = useUserStore()
const router = useRouter()

const isAdmin = computed(() =>
  userStore.hasPermission('business_cards.all', 'read')
)
const canCreate = computed(() =>
  userStore.hasPermission('business_cards.all', 'create')
)
const canEdit = computed(() =>
  userStore.hasPermission('business_cards.all', 'edit')
)
const canDelete = computed(() =>
  userStore.hasPermission('business_cards.all', 'delete')
)

const targets = [
  { id: 'my', label: 'Мои карты' },
  { id: 'all', label: 'Все карты' },
]

onMounted(() => {
  store.fetchCards()
})

watch(
  () => store.target,
  () => {
    store.fetchCards()
  }
)

const headers = computed(() => {
  const cols = [
    { valueKey: 'cardTitle', title: 'Карта' },
    { valueKey: 'label', title: 'Название' },
    { valueKey: 'bank', title: 'Банк' },
    { valueKey: 'holderName', title: 'Держатель' },
    { valueKey: 'expiry', title: 'Срок' },
  ]
  if (store.target == 'all') {
    cols.push({ valueKey: 'ownerName', title: 'Сотрудник' })
  }
  cols.push(
    { valueKey: 'status', title: 'Статус' },
    {
      valueKey: 'cardLimit',
      title: 'Лимит',
      format: (v) => (v != null ? formatMoney(v) : '—'),
    }
  )
  return cols
})

const rows = computed(() =>
  store.cards.map((c) => ({
    ...c,
    label: c.label || '—',
    bank: c.bank || '—',
    holderName: c.holderName || '—',
    expiry: c.expiry || '—',
    ownerName: c.ownerId ? getUserFullName(c.ownerId) : 'Не выдана',
  }))
)

const { openCreateModal, openEditModal, openAssignModal, confirmDelete } =
  useBusinessCardActions()

function openCard(row) {
  store.returnToCards = true
  router.push({ name: 'business-card', params: { id: row.id } })
}
</script>

<style scoped>
.cards {
  display: flex;
  flex-direction: column;
  gap: calc(var(--padding-secondary) / 2);
  width: 100%;
}

.cards__end {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.cards__open {
  cursor: pointer;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
}
</style>
