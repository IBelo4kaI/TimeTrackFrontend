<template>
  <button v-if="events.length" type="button" class="history-button" :class="{ 'manager-changed': changed }"
    @mousedown.stop @touchstart.stop @dblclick.stop @contextmenu.stop @click.stop="openHistory">
    {{ label }}
  </button>
</template>
<script setup>
import { computed } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useUniversalModalStore } from '@/stores/modal'
import DayTimeHistory from './DayTimeHistory.vue'
const props = defineProps({ date: { type: String, required: true } })
const calendar = useCalendarStore()
const events = computed(() => calendar.historyForDay(props.date))
const changed = computed(() => calendar.managerChangedDay(props.date))
const label = computed(() => !changed.value ? 'История изменений'
  : events.value.at(-1)?.actorType === 'manager' ? 'Изменено руководителем' : 'Есть изменения руководителя')
const openHistory = () => useUniversalModalStore().open({
  title: 'История изменений',
  width: '38rem', showSubmitButton: false, cancelButtonText: 'Закрыть',
  fields: [{ name: 'history', type: 'component', component: DayTimeHistory, props: { events: events.value, date: props.date } }],
})
</script>
<style scoped>
.history-button { margin: .3rem; padding: .25rem; border: 0; background: transparent; color: var(--muted-text); cursor: pointer; font: inherit; font-size: .7rem; text-align: center; overflow-wrap: anywhere; }
.manager-changed { color: var(--accent); font-weight: 600; }
.history-button:hover { text-decoration: underline; }
</style>
