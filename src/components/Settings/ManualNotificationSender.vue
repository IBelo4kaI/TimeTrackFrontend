<template>
  <div class="sender-card">
    <div class="sender-card__title">Отправить уведомление сотрудникам</div>
    <div class="sender-card__hint">
      Придёт в приложение и, если у сотрудника привязан VK, туда же.
    </div>

    <div v-if="templates.length" class="sender-card__field">
      <label class="sender-card__label">Шаблон (необязательно)</label>
      <SelectUI
        v-model="selectedTemplateId"
        :options="templateOptions"
        placeholder="Свободный текст"
        @update:model-value="applyTemplate"
      />
    </div>

    <NotificationRecipientsPicker title="Получатели" v-model="recipientIds" />

    <div class="sender-card__field">
      <InputUi v-model="title" label="Заголовок" required />
    </div>
    <div class="sender-card__field">
      <label class="sender-card__label">Текст</label>
      <textarea v-model="message" rows="4" placeholder="Текст уведомления (необязательно)"></textarea>
    </div>

    <ButtonUI :disabled="isSending" @click="onSend">
      <template v-if="isSending"><LoaderTitle text="Отправка" /></template>
      <template v-else>Отправить</template>
    </ButtonUI>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import SelectUI from '@/components/SelectUI.vue'
import { getNotificationTemplates } from '@/services/notificationTemplates.api'
import { sendManualNotification } from '@/services/notifications.api'
import { useNotificationStore } from '@/stores/notification'
import { computed, onMounted, ref } from 'vue'
import NotificationRecipientsPicker from './NotificationRecipientsPicker.vue'

const notificationStore = useNotificationStore()

const templates = ref([])
const selectedTemplateId = ref(null)
const recipientIds = ref([])
const title = ref('')
const message = ref('')
const isSending = ref(false)

const templateOptions = computed(() => [
  { value: null, label: 'Свободный текст' },
  ...templates.value.map((t) => ({ value: t.id, label: t.name })),
])

function applyTemplate(id) {
  const template = templates.value.find((t) => t.id === id)
  if (!template) return
  title.value = template.title
  message.value = template.message
}

async function loadTemplates() {
  try {
    templates.value = (await getNotificationTemplates()) ?? []
  } catch {
    templates.value = []
  }
}

async function onSend() {
  if (!recipientIds.value.length) {
    notificationStore.addNotification('Выберите хотя бы одного получателя', 'error')
    return
  }
  if (!title.value.trim()) {
    notificationStore.addNotification('Укажите заголовок', 'error')
    return
  }

  isSending.value = true
  try {
    await sendManualNotification({
      userIds: recipientIds.value,
      title: title.value.trim(),
      message: message.value.trim(),
    })
    notificationStore.addNotification('Уведомление отправлено', 'success')
    recipientIds.value = []
    title.value = ''
    message.value = ''
    selectedTemplateId.value = null
  } catch (err) {
    notificationStore.addNotification(
      err?.response?.data?.error ?? 'Не удалось отправить уведомление',
      'error'
    )
  } finally {
    isSending.value = false
  }
}

onMounted(loadTemplates)
</script>

<style scoped>
.sender-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.86rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.sender-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.sender-card__hint {
  font-size: 0.86rem;
  color: var(--muted-text);
  margin-top: -0.57rem;
}

.sender-card__field {
  display: flex;
  flex-direction: column;
  gap: 0.36rem;
  width: 100%;
}

.sender-card__label {
  font-size: 0.93rem;
  font-weight: 500;
  color: var(--text);
}

textarea {
  padding: 0.57rem 0.86rem;
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  outline: none;
  font-size: 1rem;
  font-family: inherit;
  background-color: var(--foreground);
  resize: vertical;
}

textarea:hover {
  border-color: var(--accent);
}
</style>
