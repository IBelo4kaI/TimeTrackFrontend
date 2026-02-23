<template>
  <div class="settings-vacation">
    <div class="vacation-title">Мак. количество дней в отпуске</div>
    <div class="vacation-minus">
      <ButtonUI
        type="muted"
        icon="fa-light fa-minus"
        @click="editDuration('-')"
      />
    </div>
    <div class="vacation-value">
      <template v-if="duration != null">
        {{ duration }}
      </template>
      <i v-else class="fa-regular fa-loader fa-spin"></i>
    </div>
    <div class="vacation-add">
      <ButtonUI
        type="muted"
        icon="fa-light fa-plus"
        @click="editDuration('+')"
      />
    </div>
  </div>
</template>

<script setup>
import ButtonUI from '@/components/ButtonUI.vue'
import {
  getSettingVacationDuration,
  updateSettingVacationDuration,
} from '@/services/systemSettings.api'
import { onMounted, ref } from 'vue'

const duration = ref(null)

const editDuration = async (action) => {
  switch (action) {
    case '+':
      duration.value += 1
      break
    case '-':
      duration.value -= 1
      break
  }

  const res = await updateSettingVacationDuration(duration.value)
  duration.value = Number(res)
}

onMounted(async () => {
  const res = await getSettingVacationDuration()
  duration.value = Number(res)
})
</script>

<style scoped>
.settings-vacation {
  display: flex;
  gap: calc(var(--padding-secondary) / 2);
}
.vacation-title {
  display: flex;
  align-items: center;
  height: 3rem;
  padding: 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  background: var(--foreground);
  border-radius: var(--border-radius);
  border: 0.07rem solid var(--border-color);
}
.vacation-value {
  display: flex;
  align-items: center;
  height: 3rem;
  font-size: 1.25rem;
  font-weight: 600;
}
</style>
