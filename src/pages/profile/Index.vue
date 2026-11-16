<template>
  <div class="profile-page">
    <section class="card identity">
      <div class="avatar">{{ initials }}</div>
      <div>
        <h1>{{ fullName }}</h1>
        <p v-if="employee?.position || employee?.department" class="muted">
          {{ [employee.position, employee.department].filter(Boolean).join(' · ') }}
        </p>
      </div>
    </section>

    <section class="card">
      <h2>Личные данные</h2>
      <dl class="details">
        <div><dt>Фамилия</dt><dd>{{ user?.surname || '—' }}</dd></div>
        <div><dt>Имя</dt><dd>{{ user?.name || '—' }}</dd></div>
        <div><dt>Отчество</dt><dd>{{ user?.patronymic || '—' }}</dd></div>
        <div v-if="user?.birthday"><dt>Дата рождения</dt><dd>{{ birthday }}</dd></div>
      </dl>
    </section>

    <section v-if="employee" class="card">
      <h2>Работа</h2>
      <dl class="details">
        <div v-if="employee.position"><dt>Должность</dt><dd>{{ employee.position }}</dd></div>
        <div v-if="employee.department"><dt>Отдел</dt><dd>{{ employee.department }}</dd></div>
      </dl>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { getInternalEmployees } from '@/services/reference.api'
import { useHeaderTitleStore } from '@/stores/headerTitle'
import { useUserStore } from '@/stores/user'
import { flattenInternalEmployees } from '@/utils/user.utils'

useHeaderTitleStore().setTitle('Личный кабинет', 'Информация о сотруднике')

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const employee = ref(null)
const fullName = computed(() =>
  [user.value?.surname, user.value?.name, user.value?.patronymic].filter(Boolean).join(' ') || 'Сотрудник'
)
const initials = computed(() =>
  [user.value?.surname?.[0], user.value?.name?.[0]].filter(Boolean).join('').toUpperCase() || '?'
)
const birthday = computed(() => {
  const date = new Date(user.value.birthday)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU')
})

onMounted(async () => {
  const employees = flattenInternalEmployees(await getInternalEmployees())
  employee.value = employees.find((item) => String(item.user_id) === String(user.value?.id)) ?? null
})
</script>

<style scoped>
.profile-page {
  display: grid;
  gap: var(--gap-primary);
  align-content: start;
  max-width: 70rem;
}

.card {
  background: var(--foreground);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--padding-primary);
}

.identity {
  display: flex;
  align-items: center;
  gap: var(--padding-primary);
}

.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 4rem;
  height: 4rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 1.3rem;
  font-weight: 700;
}

h1 { font-size: 1.5rem; }
h2 { font-size: 1.15rem; margin-bottom: var(--padding-secondary); }
.muted, dt { color: var(--muted-text); }
.details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--padding-secondary); }
dt { margin-bottom: 0.35rem; }
dd { font-weight: 600; overflow-wrap: anywhere; }

@media (max-width: 600px) {
  .details { grid-template-columns: 1fr; }
}
</style>
