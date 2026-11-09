<template>
  <section class="file-panel">
    <h2>Файлы <span class="count">{{ files.length }}</span></h2>
    <p v-if="loading" class="muted" role="status">Загрузка файлов…</p>
    <div v-else-if="error" role="alert"><p>{{ error }}</p><ButtonUI @click="load">Повторить</ButtonUI></div>
    <ul v-else-if="files.length" class="file-list">
      <li v-for="file in files" :key="file.id" class="file-item">
        <span class="file-type">{{ extension(file.originalName) }}</span>
        <div class="file-info">
          <button type="button" class="file-open" @click="previewFileId = file.id">{{ file.originalName }}</button>
          <small>{{ size(file.sizeBytes) }} · {{ nameFor(file.uploadedByUserId) }}</small>
          <small>{{ displayTimestamp(file.createdAt) }}</small>
          <div class="file-actions">
            <ButtonUI type="muted-accent" @click="previewFileId = file.id">Предпросмотр</ButtonUI>
            <ButtonUI type="muted-accent" :disabled="busy" @click="download(file)">Скачать</ButtonUI>
            <ButtonUI v-if="canDelete" type="destructive" :disabled="busy" @click="remove(file)">Удалить</ButtonUI>
          </div>
        </div>
      </li>
    </ul>
    <div v-else class="files-empty">
      <i class="fa-regular fa-files" aria-hidden="true"></i>
      <strong>Файлов нет</strong>
      <p>Обычно прикладывают подписанное заявление и подтверждающие документы.</p>
    </div>
    <label v-if="canUpload" class="dropzone" :class="{ dragging, disabled: busy }" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="drop">
      <i class="fa-regular fa-cloud-arrow-up" aria-hidden="true"></i>
      <strong>{{ busy ? 'Загрузка…' : 'Перетащите файлы или выберите' }}</strong>
      <small>PDF, DOC, DOCX, JPG, PNG · до 10 МБ каждый</small>
      <input class="file-input" type="file" aria-label="Выбрать файлы для заявки" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" :disabled="busy" @change="select" />
    </label>
    <p v-else class="muted">Нет прав на загрузку файлов.</p>
    <VacationFilePreview v-if="previewFileId" :files="files" :initial-file-id="previewFileId" @close="previewFileId = null" />
  </section>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { getEntityFiles, openFile, deleteFile } from '@/services/files.api'
import { uploadVacationFile } from '@/services/vacation.api'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { useConfirmModal } from '@/stores/confirmModal'
import { displayTimestamp } from '@/helpers/useVacationApplication'

const VacationFilePreview = defineAsyncComponent(() => import('./VacationFilePreview.vue'))
const previewFileId = ref(null)

const props = defineProps({ vacationId: { type: String, required: true }, vacation: Object })
const emit = defineEmits(['changed'])
const userStore = useUserStore()
const notifications = useNotificationStore()
const confirm = useConfirmModal()
const files = ref([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const dragging = ref(false)
const canUpload = computed(() => !!props.vacation && (
  userStore.hasPermission('vacation.all', 'edit') ||
  (String(props.vacation?.userId) === String(userStore.user?.id) && userStore.hasPermission('vacation', 'edit'))
))
const canDelete = computed(() => canUpload.value && userStore.hasPermission('files', 'delete'))
const nameFor = (id) => {
  const user = userStore.usersAll.find((item) => String(item.id) === String(id))
  return user ? [user.surname, user.name].filter(Boolean).join(' ') : 'Сотрудник'
}
const extension = (name) => name?.split('.').pop()?.toUpperCase() ?? 'ФАЙЛ'
const size = (bytes) => Number(bytes) < 1024 * 1024 ? `${Math.ceil(Number(bytes) / 1024)} КБ` : `${(Number(bytes) / 1024 / 1024).toFixed(1)} МБ`
let seq = 0
async function load() {
  const current = ++seq
  loading.value = true
  error.value = ''
  try { const result = await getEntityFiles('vacation', props.vacationId); if (current === seq) files.value = result ?? [] }
  catch { if (current === seq) error.value = 'Не удалось загрузить файлы' }
  finally { if (current === seq) loading.value = false }
}
watch(() => props.vacationId, load, { immediate: true })
async function download(file) {
  try {
    const blob = await openFile(file.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.originalName
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch { notifications.addNotification('Не удалось скачать файл', 'error') }
}
async function upload(selected) {
  if (!canUpload.value || busy.value) return
  busy.value = true
  let changed = false
  const vacationId = props.vacationId
  try {
    for (const file of selected) {
      if (file.size > 10 * 1024 * 1024 || !/\.(pdf|docx?|jpe?g|png)$/i.test(file.name)) {
        notifications.addNotification(`${file.name}: допустимы PDF, DOC, DOCX, JPG, PNG до 10 МБ`, 'error')
        continue
      }
      try { await uploadVacationFile(vacationId, file); changed = true }
      catch (err) { notifications.addNotification(err.response?.data?.error || `Не удалось загрузить ${file.name}`, 'error') }
    }
    if (changed) { await load(); emit('changed') }
  } finally { busy.value = false }
}
function select(event) { const selected = [...event.target.files]; event.target.value = ''; upload(selected) }
function drop(event) { dragging.value = false; upload([...event.dataTransfer.files]) }
function remove(file) {
  confirm.open(async () => {
    if (!canDelete.value || busy.value) return
    busy.value = true
    try { await deleteFile(file.id); await load(); emit('changed') }
    catch (err) { notifications.addNotification(err.response?.data?.error || 'Не удалось удалить файл', 'error') }
    finally { busy.value = false }
  }, `Удалить файл «${file.originalName}»?`)
}
</script>

<style scoped>
.file-panel { padding: var(--padding-secondary); background: var(--foreground); border: 1px solid var(--border-color); border-radius: var(--border-radius); }
h2 { display: flex; align-items: center; gap: .5rem; margin: 0 0 1rem; font-size: 1.1rem; }
.count { padding: .1rem .5rem; background: var(--muted-foreground); border-radius: 1rem; font-size: .85rem; color: var(--muted-text); }
.file-list { list-style: none; padding: 0; margin: 0; }
.file-item { display: flex; gap: .75rem; padding: 1rem 0; border-bottom: 1px solid var(--border-color); }
.file-item:first-child { padding-top: 0; }
.file-type { flex-shrink: 0; align-self: flex-start; padding: .5rem; border-radius: var(--border-radius); background: var(--muted-accent); color: var(--accent); font-size: .7rem; font-weight: 700; }
.file-info { min-width: 0; display: flex; flex-direction: column; gap: .3rem; }
.file-open { padding: 0; border: 0; background: none; color: var(--text); font: inherit; font-size: .9rem; font-weight: 600; text-align: left; overflow-wrap: anywhere; cursor: pointer; }
.file-open:hover { color: var(--accent); }
small, .muted { color: var(--muted-text); font-size: .8rem; }
.file-actions { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .4rem; }
.files-empty { text-align: center; color: var(--muted-text); padding: 1rem 0; font-size: .9rem; }
.files-empty i { display: block; font-size: 1.7rem; margin-bottom: .75rem; }
.dropzone { position: relative; display: flex; flex-direction: column; align-items: center; gap: .65rem; margin-top: 1rem; border: 1px dashed var(--border-color); padding: var(--padding-secondary); border-radius: var(--border-radius); cursor: pointer; text-align: center; font-size: .85rem; }
.dropzone:focus-within, .dropzone.dragging { border-color: var(--accent); background: var(--muted-accent); }
.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.dropzone.disabled { opacity: .6; cursor: wait; }
</style>
