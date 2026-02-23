<template>
  <div :class="['tabs-container', type]" role="tablist">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tabs-item', { 'tabs-active': activeTab === tab.id }]"
      role="tab"
      :aria-selected="activeTab === tab.id"
      :tabindex="activeTab === tab.id ? 0 : -1"
      @click="handleTabClick(tab.id)"
      @keydown.enter.prevent="handleTabClick(tab.id)"
      @keydown.space.prevent="handleTabClick(tab.id)"
      @keydown.arrow-right.prevent="handleArrowKey(1)"
      @keydown.arrow-left.prevent="handleArrowKey(-1)"
    >
      <i v-if="tab.icon" :class="tab.icon" aria-hidden="true"></i>
      {{ tab.label }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) =>
      ['default', 'component', 'accent-no-background', 'accent'].includes(
        value
      ),
  },

  tabs: {
    type: Array,
    required: true,
    validator: (value) =>
      value.every(
        (tab) => tab && typeof tab === 'object' && 'id' in tab && 'label' in tab
      ),
  },
})

const emit = defineEmits(['update:modelValue', 'tab-change'])

const modelValue = defineModel()

const activeTab = ref(
  modelValue || (props.tabs.length > 0 ? props.tabs[0].id : '')
)

const handleTabClick = (tabId) => {
  if (activeTab.value === tabId) return

  activeTab.value = tabId
  emit('update:modelValue', tabId)
  emit('tab-change', tabId)
}

const handleArrowKey = (direction) => {
  const currentIndex = props.tabs.findIndex((tab) => tab.id === activeTab.value)
  const nextIndex =
    (currentIndex + direction + props.tabs.length) % props.tabs.length

  handleTabClick(props.tabs[nextIndex].id)
}

watch(
  () => modelValue,
  (newValue) => {
    if (newValue && newValue !== activeTab.value) {
      activeTab.value = newValue
    }
  }
)
</script>

<style scoped>
.tabs-container {
  display: inline-flex;
  gap: 0.1rem;
  overflow: hidden;
  align-items: center;
  border-radius: var(--border-radius);
  height: 3rem;
}
.tabs-item {
  height: 100%;
  display: flex;
  align-items: center;
}

/* default */
.default {
  padding: calc(var(--padding-secondary) / 3);
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
}

.default .tabs-item {
  cursor: pointer;
  border-radius: calc(var(--border-radius) / 2);
  padding: calc(var(--padding-secondary) / 2);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  font-weight: 600;
  color: var(--muted-text);
}

.default .tabs-item:hover:not(.tabs-active) {
  background: var(--muted-accent);
}

.default .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.default .tabs-active {
  background: var(--accent);
  color: var(--on-accent);
}

.default .tabs-active:hover {
  opacity: 0.95;
}

/* component */
.component {
  background: var(--background);
}

.component .tabs-item {
  cursor: pointer;
  padding: calc(var(--padding-secondary) / 2);
  color: var(--muted-text);
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.component .tabs-item:hover:not(.tabs-active) {
  background: var(--muted-accent);
}

.component .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.component .tabs-active {
  background: var(--foreground);
  color: var(--text);
}

.component .tabs-active:hover {
  opacity: 0.95;
}

/* accent-no-background */
.accent-no-background {
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.accent-no-background .tabs-item {
  cursor: pointer;
  padding: calc(var(--padding-secondary) / 2);
  color: var(--muted-text);
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.accent-no-background .tabs-item:hover:not(.tabs-active) {
  background: var(--muted-accent);
}

.accent-no-background .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.accent-no-background .tabs-active {
  background: var(--accent);
  color: var(--on-accent);
}

.accent-no-background .tabs-active:hover {
  opacity: 0.95;
}

/* accent */
.accent {
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
}

.accent .tabs-item {
  cursor: pointer;
  padding: calc(var(--padding-secondary) / 2);
  color: var(--muted-text);
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.accent .tabs-item:hover:not(.tabs-active) {
  background: var(--muted-accent);
}

.accent .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.accent .tabs-active {
  background: var(--accent);
  color: var(--on-accent);
}

.accent .tabs-active:hover {
  opacity: 0.95;
}
</style>
