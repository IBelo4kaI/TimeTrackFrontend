<template>
  <div class="settings-notifications">
    <div class="settings-notifications__title">Уведомления о новых заявках</div>
    <div class="settings-notifications__hint">
      Уведомление придёт в приложение и, если у сотрудника привязан VK, туда же.
      Для отпусков и больничных получатели настраиваются отдельно.
    </div>

    <NotificationRecipientsPicker
      title="Отпуска"
      :model-value="vacationIds"
      :is-loading="isLoadingVacation"
      @update:model-value="onVacationChange"
    />
    <NotificationRecipientsPicker
      title="Больничные"
      :model-value="sickLeaveIds"
      :is-loading="isLoadingSickLeave"
      @update:model-value="onSickLeaveChange"
    />
  </div>

  <div class="settings-notifications">
    <div class="settings-notifications__title">
      Уведомления об утверждении отпуска
    </div>
    <div class="settings-notifications__hint">
      Отдельно от списка выше: сам сотрудник о решении по своей заявке
      уведомляется всегда автоматически, тут — кому ещё сообщить, когда его
      отпуск утвердили (ФИО и даты).
    </div>

    <NotificationRecipientsPicker
      title="Утверждённые отпуска"
      :model-value="vacationApprovedIds"
      :is-loading="isLoadingVacationApproved"
      @update:model-value="onVacationApprovedChange"
    />

    <div class="settings-notifications__email">
      <InputUi
        v-model="vacationApprovedEmailDraft"
        type="email"
        label="Почта"
        placeholder="buhgalteria@company.ru"
        hint="Письмо со сканом уходит только когда заявка утверждена И к ней прикреплён скан — пусто, если отправлять не нужно"
        :disabled="isLoadingVacationApprovedEmail"
      />
      <ButtonUI
        type="muted-accent"
        icon="fa-regular fa-check"
        :disabled="
          !vacationApprovedEmailChanged || isSavingVacationApprovedEmail
        "
        @click="onSaveVacationApprovedEmail"
      >
        Сохранить
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import {
  getSickLeaveNotificationAdminUserIds,
  getVacationApprovedNotificationEmail,
  getVacationApprovedNotificationUserIds,
  getVacationNotificationAdminUserIds,
  updateSickLeaveNotificationAdminUserIds,
  updateVacationApprovedNotificationEmail,
  updateVacationApprovedNotificationUserIds,
  updateVacationNotificationAdminUserIds,
} from '@/services/systemSettings.api'
import { useNotificationStore } from '@/stores/notification'
import { computed, onMounted, ref } from 'vue'
import NotificationRecipientsPicker from './NotificationRecipientsPicker.vue'

const notificationStore = useNotificationStore()

const vacationIds = ref([])
const sickLeaveIds = ref([])
const vacationApprovedIds = ref([])
const isLoadingVacation = ref(true)
const isLoadingSickLeave = ref(true)
const isLoadingVacationApproved = ref(true)

// Черновик до "Сохранить" — та же схема, что у категории чека в
// ReceiptInfo.vue: сохраняем не на каждый ввод символа, а по клику.
const vacationApprovedEmail = ref('')
const vacationApprovedEmailDraft = ref('')
const isLoadingVacationApprovedEmail = ref(true)
const isSavingVacationApprovedEmail = ref(false)
const vacationApprovedEmailChanged = computed(
  () => vacationApprovedEmailDraft.value !== vacationApprovedEmail.value
)

async function onVacationChange(ids) {
  const previous = vacationIds.value
  vacationIds.value = ids
  try {
    await updateVacationNotificationAdminUserIds(ids)
  } catch {
    vacationIds.value = previous
    notificationStore.addNotification(
      'Не удалось сохранить получателей уведомлений',
      'error'
    )
  }
}

async function onSickLeaveChange(ids) {
  const previous = sickLeaveIds.value
  sickLeaveIds.value = ids
  try {
    await updateSickLeaveNotificationAdminUserIds(ids)
  } catch {
    sickLeaveIds.value = previous
    notificationStore.addNotification(
      'Не удалось сохранить получателей уведомлений',
      'error'
    )
  }
}

async function onVacationApprovedChange(ids) {
  const previous = vacationApprovedIds.value
  vacationApprovedIds.value = ids
  try {
    await updateVacationApprovedNotificationUserIds(ids)
  } catch {
    vacationApprovedIds.value = previous
    notificationStore.addNotification(
      'Не удалось сохранить получателей уведомлений',
      'error'
    )
  }
}

async function onSaveVacationApprovedEmail() {
  const value = vacationApprovedEmailDraft.value.trim()
  isSavingVacationApprovedEmail.value = true
  try {
    await updateVacationApprovedNotificationEmail(value)
    vacationApprovedEmail.value = value
    vacationApprovedEmailDraft.value = value
    notificationStore.addNotification('Почта сохранена', 'success')
  } catch {
    notificationStore.addNotification('Не удалось сохранить почту', 'error')
  } finally {
    isSavingVacationApprovedEmail.value = false
  }
}

onMounted(async () => {
  try {
    vacationIds.value = (await getVacationNotificationAdminUserIds()) ?? []
  } catch {
    vacationIds.value = []
  } finally {
    isLoadingVacation.value = false
  }

  try {
    sickLeaveIds.value = (await getSickLeaveNotificationAdminUserIds()) ?? []
  } catch {
    sickLeaveIds.value = []
  } finally {
    isLoadingSickLeave.value = false
  }

  try {
    vacationApprovedIds.value =
      (await getVacationApprovedNotificationUserIds()) ?? []
  } catch {
    vacationApprovedIds.value = []
  } finally {
    isLoadingVacationApproved.value = false
  }

  try {
    const email = (await getVacationApprovedNotificationEmail()) ?? ''
    vacationApprovedEmail.value = email
    vacationApprovedEmailDraft.value = email
  } catch {
    vacationApprovedEmail.value = ''
    vacationApprovedEmailDraft.value = ''
  } finally {
    isLoadingVacationApprovedEmail.value = false
  }
})
</script>

<style scoped>
.settings-notifications {
  display: flex;
  flex-direction: column;
  gap: 1.07rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.settings-notifications__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.settings-notifications__hint {
  font-size: 0.86rem;
  color: var(--muted-text);
  margin-top: -0.71rem;
}

.settings-notifications__email {
  display: flex;
  align-items: flex-end;
  gap: var(--gap-primary);
}

.settings-notifications__email > :first-child {
  flex: 1;
}
</style>
