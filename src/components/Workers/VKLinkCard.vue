<template>
  <div class="card">
    <div class="card-title">VK-уведомления</div>

    <LoaderTitle v-if="isLoading" />

    <template v-else-if="linked">
      <div class="vk-status">
        <i class="fa-brands fa-vk vk-status__icon"></i>
        <span>Аккаунт привязан — уведомления дублируются в VK</span>
      </div>
      <ButtonUI type="muted" @click="onUnlink">Отвязать</ButtonUI>
    </template>

    <template v-else-if="code">
      <template v-if="linkUrl">
        <p class="vk-hint">
          Нажмите — откроется бот в VK, останется нажать «Начать»:
        </p>
        <a :href="linkUrl" target="_blank" rel="noopener" class="vk-open-link">
          <i class="fa-brands fa-vk"></i>
          Открыть бота и привязать
        </a>
        <p class="vk-hint vk-hint--muted">
          Не открылось само — отправьте боту код вручную:
        </p>
      </template>
      <p v-else class="vk-hint">
        Отправьте это сообщение нашему боту в VK, чтобы привязать аккаунт:
      </p>
      <div class="vk-code">{{ code }}</div>
      <p class="vk-hint vk-hint--muted">Код действует {{ expiresLabel }}</p>
      <a
        :href="VK_COMMUNITY_URL"
        target="_blank"
        rel="noopener"
        class="vk-community-link"
      >
        <i class="fa-brands fa-vk"></i>
        Открыть сообщество
      </a>
    </template>

    <template v-else>
      <p class="vk-hint">
        Привяжите VK, чтобы уведомления о новых чатах и сообщениях дублировались
        туда.
      </p>
      <ButtonUI @click="onGenerate">Привязать VK</ButtonUI>
    </template>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { generateVKLinkCode, getVKStatus, unlinkVK } from '@/services/vk.api'
import { useConfirmModal } from '@/stores/confirmModal'
import { useNotificationStore } from '@/stores/notification'
import { computed, onMounted, ref } from 'vue'

const VK_COMMUNITY_URL = 'https://vk.ru/timetrackcr'

const notificationStore = useNotificationStore()
const confirmModalStore = useConfirmModal()

const isLoading = ref(true)
const linked = ref(false)
const code = ref('')
const linkUrl = ref('')
const expiresInSeconds = ref(0)

const expiresLabel = computed(
  () => `${Math.round(expiresInSeconds.value / 60)} мин.`
)

async function loadStatus() {
  isLoading.value = true
  try {
    const status = await getVKStatus()
    linked.value = !!status?.linked
  } catch {
    notificationStore.addNotification('Не удалось проверить статус VK', 'error')
  } finally {
    isLoading.value = false
  }
}

async function onGenerate() {
  try {
    const result = await generateVKLinkCode()
    code.value = result.code
    linkUrl.value = result.linkUrl
    expiresInSeconds.value = result.expiresInSeconds
  } catch {
    notificationStore.addNotification('Не удалось сгенерировать код', 'error')
  }
}

function onUnlink() {
  confirmModalStore.open(async () => {
    try {
      await unlinkVK()
      linked.value = false
      code.value = ''
      linkUrl.value = ''
    } catch {
      notificationStore.addNotification('Не удалось отвязать VK', 'error')
    }
  }, 'Отвязать VK-аккаунт? Уведомления перестанут туда дублироваться.')
}

onMounted(loadStatus)
</script>

<style scoped>
.card {
  padding: var(--padding-secondary);
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.vk-hint {
  font-size: 0.93rem;
  color: var(--muted-text);
}

.vk-hint--muted {
  font-size: 0.79rem;
}

.vk-status {
  display: flex;
  align-items: center;
  gap: 0.57rem;
  font-size: 0.93rem;
  color: var(--text);
}

.vk-status__icon {
  font-size: 1.29rem;
  color: #0077ff;
}

.vk-code {
  align-self: flex-start;
  padding: 0.5rem 0.86rem;
  background: var(--muted-foreground);
  border-radius: calc(var(--border-radius) * 0.7);
  font-size: 1.14rem;
  font-weight: 700;
  letter-spacing: 0.14rem;
  color: var(--accent);
}

.vk-open-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.43rem;
  padding: 0.5rem 0.86rem;
  background: #0077ff;
  border-radius: var(--border-radius);
  font-size: 0.93rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
}

.vk-open-link:hover {
  filter: brightness(0.93);
}

.vk-community-link {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.43rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: #0077ff;
  text-decoration: none;
}

.vk-community-link:hover {
  text-decoration: underline;
}
</style>
