<template>
  <div class="manager-settings">
    <section class="role-settings">
      <h3>Роль руководителя отдела</h3>
      <p class="hint">Укажите ID роли из сервиса авторизации с разрешением управления отделом.</p>
      <form class="role-form" @submit.prevent="saveRoleSetting(roleDraft)">
        <label>ID роли
          <input v-model="roleDraft" maxlength="255" placeholder="ID роли в сервисе авторизации" :readonly="!canEdit" :disabled="busy || !roleLoaded" />
        </label>
        <div v-if="canEdit" class="actions">
          <ButtonUI type="muted" :disabled="busy || !roleLoaded || !savedRoleId" @click.prevent="saveRoleSetting('')">Удалить ID роли</ButtonUI>
          <ButtonUI type="accent" :disabled="busy || !roleLoaded || roleDraft.trim() === savedRoleId">Сохранить</ButtonUI>
        </div>
      </form>
      <p v-if="roleError" class="directory-error" role="alert">{{ roleError }} <ButtonUI type="muted" :disabled="loading" @click="load">Повторить загрузку</ButtonUI></p>
      <p class="hint">Изменения применяются к новым назначениям. Для существующих нажмите «Синхронизировать роль». Пустой ID отключает автоматическую выдачу роли новым руководителям.</p>
    </section>
    <AppTable :headers="headers" :rows="items" :loading="loading" row-key="id" empty-text="Руководители пока не назначены">
      <template #toolbar>
        <div class="settings-title">Руководители отделов</div>
        <div class="spacer"></div>
        <ButtonUI v-if="canEdit" :disabled="busy" @click="openCreateModal">Назначить руководителя</ButtonUI>
      </template>
      <template #cell-userId="{ row }">{{ nameFor(row.userId) }}</template>
      <template #cell-roleSyncStatus="{ row }">
        <div class="role-status">
          <Badge :type="roleMeta(row).type">{{ roleMeta(row).text }}</Badge>
          <small v-if="row.authRoleId">ID роли: {{ row.authRoleId }}</small>
          <small v-if="row.roleSyncStatus === 'not_configured' && !savedRoleId">Укажите ID роли в настройке выше.</small>
        </div>
      </template>
      <template #actions="{ row }">
        <div class="actions" v-if="canEdit">
          <ButtonUI v-if="needsRoleSync(row)" :disabled="busy" @click="syncRole(row)">Синхронизировать роль</ButtonUI>
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
    <p class="hint">Для согласования нужны назначение в справочнике и разрешение управления отделом. При удалении назначения выданная роль снимается, если она больше не используется другими назначениями сотрудника.</p>
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
import { getDepartmentManagers, getDepartmentManagerCandidates, createDepartmentManager, deleteDepartmentManager, syncDepartmentManagerRole, getDepartmentManagerRoleId, updateDepartmentManagerRoleId } from '@/services/departmentManagers.api'

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
const roleDraft = ref('')
const savedRoleId = ref('')
const roleLoaded = ref(false)
const roleError = ref('')
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
function needsRoleSync(row) {
  return roleLoaded.value && !!(savedRoleId.value || row.authRoleId) && (row.roleSyncStatus !== 'synced' || row.authRoleId !== savedRoleId.value)
}
function roleMeta(row) {
  if (row.roleSyncStatus === 'synced' && roleLoaded.value && row.authRoleId !== savedRoleId.value) return { text: 'Требуется синхронизация', type: 'warn' }
  return {
    synced: { text: 'Назначена автоматически', type: 'success' },
    failed: { text: 'Ошибка синхронизации', type: 'destruct' },
    pending: { text: 'Ожидает назначения', type: 'warn' },
    not_configured: { text: 'Роль не настроена', type: 'muted' },
  }[row.roleSyncStatus] || { text: 'Неизвестно', type: 'muted' }
}
async function load() {
  loading.value = true
  const [list, directory, role] = await Promise.allSettled([getDepartmentManagers(), getDepartmentManagerCandidates(), getDepartmentManagerRoleId()])
  roleLoaded.value = role.status === 'fulfilled'
  roleError.value = role.status === 'rejected' ? role.reason.message || 'Не удалось загрузить настройку роли' : ''
  if (role.status === 'fulfilled') { savedRoleId.value = role.value; roleDraft.value = role.value }
  if (list.status === 'fulfilled') items.value = list.value ?? []
  else notifications.addNotification(list.reason.message || 'Не удалось загрузить руководителей', 'error')
  candidates.value = directory.status === 'fulfilled' ? directory.value ?? [] : []
  directoryError.value = directory.status === 'rejected' ? directory.reason.message || 'Кадровый справочник недоступен' : ''
  loading.value = false
}
async function saveRoleSetting(value) {
  if (busy.value || !canEdit.value || !roleLoaded.value) return
  const roleId = value.trim()
  busy.value = true
  try {
    await updateDepartmentManagerRoleId(roleId)
    savedRoleId.value = roleId
    roleDraft.value = roleId
    notifications.addNotification(roleId ? 'ID роли сохранён' : 'ID роли удалён из настроек', 'success')
  } catch (error) { notifications.addNotification(error.message || 'Не удалось сохранить ID роли', 'error') }
  finally { busy.value = false }
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
    const result = await createDepartmentManager({ ...draft, company: employee.company })
    showForm.value = false
    Object.assign(draft, { department: '', userId: '' })
    notifications.addNotification(result.roleSyncStatus === 'failed' ? 'Назначение сохранено, но выдать роль не удалось. Повторите синхронизацию.' : 'Руководитель назначен', result.roleSyncStatus === 'failed' ? 'error' : 'success')
    await load()
  } catch (error) { notifications.addNotification(error.message || 'Не удалось сохранить назначение', 'error') }
  finally { busy.value = false }
}
function remove(row) {
  confirm.open(async () => {
    busy.value = true
    try { await deleteDepartmentManager(row.id); await load() }
    catch (error) { notifications.addNotification(error.message || 'Не удалось удалить назначение', 'error'); await load(); throw error }
    finally { busy.value = false }
  }, `Удалить назначение руководителя ${nameFor(row.userId)}?`)
}
async function syncRole(row) {
  if (busy.value) return
  busy.value = true
  try {
    const result = await syncDepartmentManagerRole(row.id)
    notifications.addNotification(result.roleSyncStatus === 'failed' ? 'Не удалось синхронизировать роль с сервисом авторизации' : savedRoleId.value ? 'Роль синхронизирована' : 'Роль снята', result.roleSyncStatus === 'failed' ? 'error' : 'success')
    await load()
  }
  catch (error) { notifications.addNotification(error.message || 'Не удалось назначить роль', 'error') }
  finally { busy.value = false }
}
onMounted(load)
</script>

<style scoped>
.manager-settings { display: flex; flex-direction: column; gap: .75rem; }
.role-settings { display: flex; flex-direction: column; gap: .75rem; padding: var(--padding-secondary); background: var(--foreground); border: 1px solid var(--border-color); border-radius: var(--border-radius); }
.role-settings h3 { margin: 0; font-size: 1.1rem; }
.role-form { display: flex; align-items: flex-end; flex-wrap: wrap; gap: .75rem; }
.role-form label { flex: 1; min-width: min(18rem, 100%); }
.settings-title { font-weight: 600; }
.spacer { flex: 1; }
.assignment-form { display: flex; flex-direction: column; gap: 1rem; }
.hint, small { color: var(--muted-text); font-size: .85rem; line-height: 1.5; }
.hint { margin: 0; }
.fields { display: grid; grid-template-columns: 1fr; gap: .75rem; }
label { min-width: 0; font-size: .85rem; }
select, input { display: block; box-sizing: border-box; width: 100%; height: 3rem; margin-top: .35rem; padding: .5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); background: var(--background); color: var(--text); font: inherit; }
.actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .5rem; }
.role-status { display: flex; flex-direction: column; align-items: flex-start; gap: .35rem; }
.directory-error { color: var(--destructive); margin-top: .75rem; }
</style>
