<template>
  <div class="participants-picker">
    <Autocomplete
      v-model="pickerValue"
      :options="availableUsers"
      :label-key="['surname', 'name']"
      value-key="id"
      placeholder="Найти сотрудника..."
      :is-show-button="false"
      @select="onSelect"
    />
    <div v-if="modelValue.length" class="picker-chips">
      <span v-for="id in modelValue" :key="id" class="chip">
        {{ nameById(id) }}
        <button type="button" class="chip-remove" @click="remove(id)">
          <i class="fa-regular fa-xmark"></i>
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import Autocomplete from '@/components/Autocomplete.vue'
import { useUserStore } from '@/stores/user'
import { computed, ref } from 'vue'

const modelValue = defineModel({ default: () => [] })

const userStore = useUserStore()
const pickerValue = ref('')

const availableUsers = computed(() =>
  userStore.usersAll.filter(
    (u) => u.id !== userStore.user?.id && !modelValue.value.includes(u.id)
  )
)

function onSelect(option) {
  modelValue.value = [...modelValue.value, option.id]
  pickerValue.value = ''
}

function remove(id) {
  modelValue.value = modelValue.value.filter((x) => x !== id)
}

function nameById(id) {
  const u = userStore.usersAll.find((x) => x.id === id)
  return u ? [u.surname, u.name].filter(Boolean).join(' ') : id
}
</script>

<style scoped>
.participants-picker {
  display: flex;
  flex-direction: column;
  gap: 0.71rem;
}

.picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.43rem;
  padding: 0.36rem 0.36rem 0.36rem 0.71rem;
  background: var(--muted-accent);
  color: var(--accent);
  border-radius: 1rem;
  font-size: 0.93rem;
  font-weight: 500;
}

.chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.29rem;
  height: 1.29rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.15s ease;
}

.chip-remove:hover {
  background: rgba(0, 0, 0, 0.08);
}
</style>
