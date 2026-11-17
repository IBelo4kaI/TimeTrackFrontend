<template>
  <div class="manager-settings">
    <AppTable :headers="headers" :rows="items" :loading="loading" row-key="id" empty-text="Руководители пока не назначены">
      <template #toolbar>
        <div class="settings-title">Руководители отделов</div>
        <div class="spacer"></div>
        <ButtonUI v-if="canEdit" :disabled="busy" @click="openCreateModal">Назначить руководителя</ButtonUI>
      </template>
      <template #cell-userId="{ row }">{{ nameFor(row.userId) }}</template>
      <template #cell-roleSyncStatus="{ row }">
        <div class="role-status">
          <Badge :type="roleMeta(row.roleSyncStatus).type">{{ roleMeta(row.roleSyncStatus).text }}</Badge>
          <small v-if="row.roleSyncStatus === 'not_configured'">Выдайте роль с правом управления отделом в сервисе авторизации.</small>
        </div>
      </template>
      <template #actions="{ row }">
        <div class="actions" v-if="canEdit">
          <ButtonUI v-if="row.roleSyncStatus === 'failed' || row.roleSyncStatus === 'pending'" :disabled="busy" @click="syncRole(row)">Повторить назначение роли</ButtonUI>
          <ButtonUI type="destructive" :disabled="busy" @click="remove(row)">Удалить</ButtonUI>
        </div>
      </template>
    </AppTable>

    <Teleport to="body">
      <ModalLayout v-if="showForm && canEdit" title="Назначить руководителя" width="36rem" @close="closeCreateModal">
        <form class="assignment-form" @submit.prevent="create">
          <p class="hint">Отдел сотрудника проверяется по кадровому справочнику. В одном отделе можно назначить нескольких руководителей.</p>
          <div v-if="directoryError" class="directory-error" role="alert">
            {{ directoryError }} <ButtonUI type="muted" :disabled="loading" @click.prevent="load">Повторить загрузку</ButtonUI>
          </div>
          <div class="fields">
            <label>Отдел
              <select v-model="draft.department" required :disabled="busy || loading || !!directoryError">
                <option value="" disabled>Выберите отдел</option>
                <option v-for="department in departments" :key="department" :value="department">{{ department }}</option>
              </select>
            </label>
            <label>Сотрудник
              <select v-model="draft.userId" required :disabled="busy || !draft.department">
                <option value="" disabled>Выберите руководителя</option>
                <option v-for="employee in employees" :key="employee.userId" :value="employee.userId">{{ nameFor(employee.userId) }}</option>
              </select>
            </label>
          </div>
          <div class="actions"><ButtonUI type="muted" :disabled="busy" @click.prevent="closeCreateModal">Отмена</ButtonUI><ButtonUI type="accent" :disabled="busy || loading || !!directoryError || !draft.userId">{{ busy ? 'Сохранение…' : 'Назначить' }}</ButtonUI></div>
        </form>
      </ModalLayout>
    </Teleport>
    <p class="hint">Для согласования нужны назначение в справочнике и разрешение управления отделом. Автоматическое назначение роли пока не подключено. Удаление назначения закрывает доступ через справочник, но не удаляет роль из сервиса авторизации.</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppTable from '@/components/AppTable.vue'
import ModalLayout from '@/layouts/ModalLayout.vue'
import Badge from '@/components/Badge.vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { useConfirmModal } from '@/stores/confirmModal'
import { getDepartmentManagers, getDepartmentManagerCandidates, createDepartmentManager, deleteDepartmentManager, syncDepartmentManagerRole } from '@/services/departmentManagers.api'

const userStore = useUserStore()
const notifications = useNotificationStore()
const confirm = useConfirmModal()
const canEdit = computed(() => userStore.hasPermission('system_settings', 'edit'))
const items = ref([])
const candidates = ref([])
const loading = ref(false)
const busy = ref(false)
const showForm = ref(false)
const directoryError = ref('')
const draft = reactive({ department: '', userId: '' })
const headers = [
  { valueKey: 'department', title: 'Отдел' },
  { valueKey: 'userId', title: 'Руководитель' },
  { valueKey: 'roleSyncStatus', title: 'Роль в сервисе авторизации' },
]
const departments = computed(() => [...new Set(candidates.value.map((item) => item.department))].sort((a, b) => a.localeCompare(b, 'ru')))
const employees = computed(() => candidates.value.filter((item) => item.department === draft.department).sort((a, b) => nameFor(a.userId).localeCompare(nameFor(b.userId), 'ru')))
watch(() => draft.department, () => { draft.userId = '' })
function nameFor(id) {
  const user = userStore.usersAll.find((item) => item.id === id) || (userStore.user?.id === id ? userStore.user : null)
  return user ? [user.surname, user.name, user.patronymic].filter(Boolean).join(' ') : id
}
function roleMeta(status) {
  return {
    synced: { text: 'Назначена автоматически', type: 'success' },
    failed: { text: 'Ошибка назначения', type: 'destruct' },
    pending: { text: 'Ожидает назначения', type: 'warn' },
    not_configured: { text: 'Автоматическое назначение не подключено', type: 'muted' },
  }[status] || { text: 'Неизвестно', type: 'muted' }
}
async function load() {
  loading.value = true
  const [list, directory] = await Promise.allSettled([getDepartmentManagers(), getDepartmentManagerCandidates()])
  if (list.status === 'fulfilled') items.value = list.value ?? []
  else notifications.addNotification(list.reason.message || 'Не удалось загрузить руководителей', 'error')
  candidates.value = directory.status === 'fulfilled' ? directory.value ?? [] : []
  directoryError.value = directory.status === 'rejected' ? directory.reason.message || 'Кадровый справочник недоступен' : ''
  loading.value = false
}
function openCreateModal() {
  if (!canEdit.value || busy.value) return
  Object.assign(draft, { department: '', userId: '' })
  showForm.value = true
}
function closeCreateModal() {
  if (!busy.value) showForm.value = false
}
async function create() {
  if (busy.value || !draft.userId) return
  const employee = employees.value.find((item) => item.userId === draft.userId)
  if (!employee) {
    notifications.addNotification('Выберите сотрудника из актуального справочника', 'error')
    return
  }
  busy.value = true
  try {
    await createDepartmentManager({ ...draft, company: employee.company })
    showForm.value = false
    Object.assign(draft, { department: '', userId: '' })
    notifications.addNotification('Руководитель назначен', 'success')
    await load()
  } catch (error) { notifications.addNotification(error.message || 'Не удалось сохранить назначение', 'error') }
  finally { busy.value = false }
}
function remove(row) {
  confirm.open(async () => {
    busy.value = true
    try { await deleteDepartmentManager(row.id); await load() }
    catch (error) { notifications.addNotification(error.message || 'Не удалось удалить назначение', 'error'); throw error }
    finally { busy.value = false }
  }, `Удалить назначение руководителя ${nameFor(row.userId)}?`)
}
async function syncRole(row) {
  if (busy.value) return
  busy.value = true
  try { await syncDepartmentManagerRole(row.id); await load() }
  catch (error) { notifications.addNotification(error.message || 'Не удалось назначить роль', 'error') }
  finally { busy.value = false }
}
onMounted(load)
</script>

<style scoped>
.manager-settings { display: flex; flex-direction: column; gap: .75rem; }
.settings-title { font-weight: 600; }
.spacer { flex: 1; }
.assignment-form { display: flex; flex-direction: column; gap: 1rem; }
.hint, small { color: var(--muted-text); font-size: .85rem; line-height: 1.5; }
.hint { margin: 0; }
.fields { display: grid; grid-template-columns: 1fr; gap: .75rem; }
label { min-width: 0; font-size: .85rem; }
select { display: block; box-sizing: border-box; width: 100%; height: 3rem; margin-top: .35rem; padding: .5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); background: var(--background); color: var(--text); font: inherit; }
.actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; }
.role-status { display: flex; flex-direction: column; align-items: flex-start; gap: .35rem; }
.directory-error { color: var(--destructive); margin-top: .75rem; }
</style>
