<template>
  <div :class="['tabs-container', type]" role="tablist">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tabs-item', { 'tabs-active': activeTab === tab.id }]"
      :style="getTabStyle(tab)"
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

/**
 * @typedef {Object} TabColors
 * @property {string} [activeBackground] - Цвет фона активного таба
 * @property {string} [activeText] - Цвет текста активного таба
 * @property {string} [text] - Цвет текста неактивного таба
 * @property {string} [hoverBackground] - Цвет фона при наведении (неактивный таб)
 */

/**
 * @typedef {Object} TabItem
 * @property {string|number} id
 * @property {string} label
 * @property {string} [icon]
 * @property {TabColors} [colors]
 */

const TAB_TYPES = [
  'default',
  'component',
  'accent-no-background',
  'accent',
  'line',
]

const props = defineProps({
  type: {
    type: String,
    default: 'default',
  },

  /** @type {import('vue').PropType<TabItem[]>} */
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
  modelValue.value ?? (props.tabs.length > 0 ? props.tabs[0].id : '')
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

/**
 * Формирует inline CSS-переменные для кастомных цветов конкретного таба
 * @param {TabItem} tab
 * @returns {Record<string, string>}
 */
const getTabStyle = (tab) => {
  const c = tab.colors
  if (!c) return {}

  const style = {}
  if (c.activeBackground) style['--tab-active-bg'] = c.activeBackground
  if (c.activeText) style['--tab-active-text'] = c.activeText
  if (c.text) style['--tab-text'] = c.text
  if (c.hoverBackground) style['--tab-hover-bg'] = c.hoverBackground

  return style
}

watch(modelValue, (newValue) => {
  if (newValue != null && newValue !== activeTab.value) {
    activeTab.value = newValue
  }
})
</script>

<style scoped>
.tabs-container {
  display: inline-flex;
  gap: 0.4rem;
  overflow: hidden;
  align-items: center;
  border-radius: var(--border-radius);
  height: 3rem;
}
.tabs-item {
  height: 100%;
  display: flex;
  align-items: center;
  color: var(--tab-text, var(--muted-text));
}

/* default */
.default {
  padding: calc(var(--padding-secondary) / 3);
  background: var(--foreground);
}

.default .tabs-item {
  cursor: pointer;
  border-radius: var(--border-radius);
  padding: calc(var(--padding-secondary) / 2);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  font-weight: 600;
}

.default .tabs-item:hover {
  background: var(--tab-hover-bg, var(--muted-accent));
}

.default .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.default .tabs-active {
  background: var(--tab-active-bg, var(--muted-accent));
  color: var(--tab-active-text, var(--accent));
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
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.component .tabs-item:hover:not(.tabs-active) {
  background: var(--tab-hover-bg, var(--muted-accent));
}

.component .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.component .tabs-active {
  background: var(--tab-active-bg, var(--foreground));
  color: var(--tab-active-text, var(--text));
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
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.accent-no-background .tabs-item:hover:not(.tabs-active) {
  background: var(--tab-hover-bg, var(--muted-accent));
}

.accent-no-background .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.accent-no-background .tabs-active {
  background: var(--tab-active-bg, var(--accent));
  color: var(--tab-active-text, var(--on-accent));
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
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.accent .tabs-item:hover:not(.tabs-active) {
  background: var(--tab-hover-bg, var(--muted-accent));
}

.accent .tabs-item:focus-visible {
  outline: 0.14rem solid var(--accent);
  outline-offset: 0.14rem;
}

.accent .tabs-active {
  background: var(--tab-active-bg, var(--accent));
  color: var(--tab-active-text, var(--on-accent));
}

.accent .tabs-active:hover {
  opacity: 0.95;
}

.line {
  gap: 0;
  background: var(--foreground);
  border-radius: 0;
}

.line .tabs-item {
  cursor: pointer;
  padding: calc(var(--padding-secondary) / 2);
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.line .tabs-item:hover:not(.tabs-active) {
  background: var(--tab-hover-bg, var(--muted-accent));
}

.line .tabs-active {
  background: var(--tab-active-bg, none);
  color: var(--tab-active-text, var(--text));
  border-bottom: 0.07rem solid var(--accent);
}

.line .tabs-active:hover {
  opacity: 0.95;
}
</style>
