<template>
  <div class="settings-smtp">
    <div class="settings-smtp__title">Почта (SMTP)</div>
    <div class="settings-smtp__hint">
      Сервер для отправки писем (например, об утверждённом отпуске со сканом заявления). Пароль
      после сохранения не показывается — хранится зашифрованным.
    </div>

    <div class="settings-smtp__grid">
      <InputUi v-model="draft.host" label="Хост" placeholder="smtp.yandex.ru" :disabled="isLoading" />
      <InputUi
        v-model.number="draft.port"
        type="number"
        label="Порт"
        placeholder="587"
        :disabled="isLoading"
      />
      <InputUi
        v-model="draft.username"
        label="Логин"
        placeholder="notifications@company.ru"
        :disabled="isLoading"
      />
      <InputUi
        v-model="draft.from"
        label="Отправитель (From)"
        placeholder="notifications@company.ru"
        :disabled="isLoading"
      />
      <InputUi
        v-model="draft.password"
        type="password"
        label="Пароль"
        :placeholder="passwordSet ? '••••••••' : ''"
        hint="Оставьте пустым, чтобы не менять сохранённый пароль"
        :disabled="isLoading"
      />
    </div>

    <div class="settings-smtp__actions">
      <ButtonUI
        type="muted-accent"
        icon="fa-regular fa-check"
        :disabled="!hasChanges || isSaving"
        @click="onSave"
      >
        Сохранить
      </ButtonUI>
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import InputUi from '@/components/InputUi.vue'
import { getSmtpSettings, updateSmtpSettings } from '@/services/smtpSettings.api'
import { useNotificationStore } from '@/stores/notification'
import { computed, onMounted, reactive, ref } from 'vue'

const notificationStore = useNotificationStore()

const isLoading = ref(true)
const isSaving = ref(false)
const passwordSet = ref(false)

const saved = reactive({ host: '', port: 587, username: '', from: '' })
const draft = reactive({ host: '', port: 587, username: '', from: '', password: '' })

const hasChanges = computed(
  () =>
    draft.host !== saved.host ||
    draft.port !== saved.port ||
    draft.username !== saved.username ||
    draft.from !== saved.from ||
    draft.password !== ''
)

async function load() {
  isLoading.value = true
  try {
    const settings = await getSmtpSettings()
    saved.host = settings.host ?? ''
    saved.port = settings.port ?? 587
    saved.username = settings.username ?? ''
    saved.from = settings.from ?? ''
    passwordSet.value = !!settings.passwordSet

    draft.host = saved.host
    draft.port = saved.port
    draft.username = saved.username
    draft.from = saved.from
    draft.password = ''
  } catch {
    notificationStore.addNotification('Не удалось загрузить настройки SMTP', 'error')
  } finally {
    isLoading.value = false
  }
}

async function onSave() {
  isSaving.value = true
  try {
    const settings = await updateSmtpSettings({
      host: draft.host,
      port: draft.port,
      username: draft.username,
      from: draft.from,
      password: draft.password || undefined,
    })
    saved.host = settings.host ?? ''
    saved.port = settings.port ?? 587
    saved.username = settings.username ?? ''
    saved.from = settings.from ?? ''
    passwordSet.value = !!settings.passwordSet
    draft.password = ''
    notificationStore.addNotification('Настройки SMTP сохранены', 'success')
  } catch {
    notificationStore.addNotification('Не удалось сохранить настройки SMTP', 'error')
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.settings-smtp {
  display: flex;
  flex-direction: column;
  gap: 1.07rem;
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}

.settings-smtp__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.settings-smtp__hint {
  font-size: 0.86rem;
  color: var(--muted-text);
  margin-top: -0.71rem;
}

.settings-smtp__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: var(--gap-primary);
}

.settings-smtp__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
