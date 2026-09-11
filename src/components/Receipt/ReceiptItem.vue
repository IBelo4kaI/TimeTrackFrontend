<template>
  <tr class="receipt-item">
    <td>
      <div class="receipt-item__status">
        <Badge type="muted">
          {{ getOperationTypeLabel(item.operationType) }}
        </Badge>
      </div>
    </td>
    <td style="width: 100%">
      <div class="receipt-item__column">
        <div class="receipt-item__user" v-if="isAdmin">
          {{ user?.surname }} {{ user?.name }} {{ user?.patronymic }}
        </div>
        <div class="receipt-item__seller">
          {{ nullString(item.sellerName) || `ИНН ${item.sellerInn}` }}
        </div>
        <div class="receipt-item__meta">
          {{ getDateNamed(parseDate(item.ticketDate)) }}
          {{ parseDate(item.ticketDate).getFullYear() }}
          <Badge type="muted" class="receipt-item__sum">
            {{ formatMoney(item.totalSum) }}
          </Badge>
        </div>
      </div>
    </td>
    <td>
      <div class="receipt-item__createAt">
        <span>Добавлен</span>
        <span>{{ parseDate(item.createdAt).toLocaleDateString() }}</span>
      </div>
    </td>
    <td>
      <div class="receipt-item__actions">
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-arrow-up-right-from-square"
          v-tooltip="'Открыть чек'"
          @click="onOpen"
        />
        <ButtonUI
          type="muted-accent"
          icon="fa-regular fa-ellipsis"
          v-tooltip="'Ещё'"
          @click="isExtraVisible = !isExtraVisible"
        />
      </div>
    </td>
  </tr>
  <tr class="receipt-item__extra" v-if="isExtraVisible">
    <td colspan="4">
      <div class="extra__container">
        <ButtonUI
          v-if="canManage"
          icon="fa-regular fa-file-import"
          type="success"
          @click="$refs.fileInput.click()"
          v-tooltip="'Прикрепить фото/скан чека'"
        >
          Прикрепить файл
        </ButtonUI>
        <input
          ref="fileInput"
          type="file"
          name="file"
          accept="image/*,.pdf"
          style="display: none"
          @change="onFileSelected"
        />

        <ButtonUI
          v-if="canManage"
          @click="
            confirmModalStore.open(
              onDeleted,
              'Вы действительно хотите удалить чек?'
            )
          "
          type="destructive"
          icon="fa-regular fa-trash-can-xmark"
          v-tooltip="'Удалить чек'"
        >
          Удалить чек
        </ButtonUI>
      </div>
    </td>
  </tr>
</template>

<script setup>
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { uploadReceiptFile } from '@/services/receipt.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { useReceiptStore } from '@/stores/receipt'
import { useUserStore } from '@/stores/user'
import { getDateNamed } from '@/utils/calendar.utils'
import { parseDate } from '@/utils/date.utils'
import {
  formatMoney,
  getOperationTypeLabel,
  nullString,
} from '@/utils/receipt.utils'
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const confirmModalStore = useConfirmModal()
const notificationStore = useNotificationStore()
const receiptStore = useReceiptStore()
const router = useRouter()
const { item, isAdmin } = defineProps(['item', 'isAdmin'])
const isExtraVisible = shallowRef(false)

const onOpen = () => {
  router.push({ name: 'receipt-view', params: { id: item.id } })
}

const user = computed(() => {
  if (isAdmin && userStore.usersAll)
    return userStore.usersAll.find((u) => u.id == item.userId)
  return null
})

// свой чек всегда можно удалить/дополнить, чужой — только с
// receipts.all:delete/edit (зеркалит RequireOwnerOrAll на бэке)
const canManage = computed(() => {
  if (isAdmin)
    return (
      userStore.hasPermission('receipts.all', 'delete') ||
      userStore.hasPermission('receipts.all', 'edit')
    )
  return true
})

const onDeleted = async () => {
  await receiptStore.removeReceipt(item.id)
  notificationStore.addNotification('Чек удалён', 'success')
}

const onFileSelected = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    notificationStore.addNotification(
      'Файл слишком большой. Максимальный размер: 10MB',
      'error'
    )
    event.target.value = ''
    return
  }

  try {
    await uploadReceiptFile(item.id, file)
    notificationStore.addNotification('Файл прикреплён', 'success')
  } catch {
    notificationStore.addNotification('Ошибка при загрузке файла', 'error')
  }

  event.target.value = ''
}
</script>

<style scoped>
.receipt-item {
  transition: all 0.3s ease;
}

.receipt-item__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.receipt-item__actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.receipt-item__user {
  font-weight: 600;
}

.receipt-item__seller {
  font-weight: 600;
  font-size: 1.2rem;
}

.receipt-item__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: var(--muted-text);
}

.receipt-item__sum {
  font-size: 0.8rem;
  font-weight: 600;
}

.receipt-item__createAt {
  display: flex;
  flex-direction: column;
}

.receipt-item__createAt span:nth-child(1) {
  font-weight: 400;
  color: var(--muted-text);
}

.receipt-item__createAt span:nth-child(2) {
  font-weight: 600;
}

.receipt-item td {
  padding: var(--padding-secondary) 0;
}

.receipt-item td:not(:last-child) {
  padding-right: var(--gap-primary);
}

.receipt-item:not(:has(+ .receipt-item__extra)) td {
  border-bottom: 0.07rem solid var(--border-color);
}

.receipt-item__extra td {
  border-bottom: 0.07rem solid var(--border-color);
  transition: all 0.3s ease;
}

.extra__container {
  display: flex;
  gap: var(--gap-primary);
  flex-wrap: wrap;
  padding: 0 0 var(--padding-secondary) 2rem;
}

@media (max-width: 768px) {
  .receipt-item__extra {
    display: flex;
    flex-direction: column;
  }

  .receipt-item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: 0.36rem 0.71rem;
    border: 0.07rem solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 0.71rem;
    margin-bottom: 0.57rem;
  }

  .receipt-item td:nth-child(1) {
    grid-column: 1;
    grid-row: 1;
  }
  .receipt-item td:nth-child(2) {
    grid-column: 1;
    grid-row: 2;
  }
  .receipt-item td:nth-child(3) {
    grid-column: 1;
    grid-row: 3;
  }
  .receipt-item td:nth-child(4) {
    grid-column: 2;
    grid-row: 1 / span 3;
  }

  .receipt-item td,
  .receipt-item__extra td {
    display: block;
    width: auto;
    padding: 0 !important;
    border: none !important;
  }

  .receipt-item__actions {
    flex-direction: column;
    justify-content: flex-start;
  }

  .receipt-item__extra {
    gap: 0.5rem;
    border: 0.07rem solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 0.71rem;
    margin-bottom: 0.57rem;
  }

  .extra__container {
    padding: 0;
    gap: 0.5rem;
  }
}
</style>
