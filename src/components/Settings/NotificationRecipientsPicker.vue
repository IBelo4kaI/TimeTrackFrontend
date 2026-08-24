<template>
  <div class="recipients-picker">
    <div class="recipients-picker__title">{{ title }}</div>

    <Autocomplete
      v-model="pickerValue"
      :options="availableUsers"
      :label-key="['surname', 'name']"
      value-key="id"
      placeholder="Найти сотрудника..."
      :is-show-button="false"
      @select="onSelect"
    />

    <LoaderTitle v-if="isLoading" />
    <div v-else-if="modelValue.length" class="picker-chips">
      <span v-for="id in modelValue" :key="id" class="chip">
        {{ nameById(id) }}
        <button type="button" class="chip-remove" @click="remove(id)">
          <i class="fa-regular fa-xmark"></i>
        </button>
      </span>
    </div>
    <div v-else class="recipients-picker__empty">Получателей пока нет</div>
  </div>
</template>

<script setup>
import Autocomplete from '@/components/Autocomplete.vue'
import LoaderTitle from '@/components/Loader/LoaderTitle.vue'
import { useUserStore } from '@/stores/user'
import { computed, ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  modelValue: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const userStore = useUserStore()
const pickerValue = ref('')

const availableUsers = computed(() =>
  userStore.usersAll.filter((u) => !props.modelValue.includes(u.id))
)

function nameById(id) {
  const u = userStore.usersAll.find((x) => x.id === id)
  return u ? [u.surname, u.name].filter(Boolean).join(' ') : id
}

function onSelect(option) {
  emit('update:modelValue', [...props.modelValue, option.id])
  pickerValue.value = ''
}

function remove(id) {
  emit(
    'update:modelValue',
    props.modelValue.filter((x) => x !== id)
  )
}
</script>

<style scoped>
.recipients-picker {
  display: flex;
  flex-direction: column;
  gap: 0.57rem;
}

.recipients-picker__title {
  font-size: 0.93rem;
  font-weight: 600;
  color: var(--text);
}

.recipients-picker__empty {
  font-size: 0.86rem;
  color: var(--muted-text);
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
