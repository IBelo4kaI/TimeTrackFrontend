<template>
  <Teleport to="body">
    <Transition name="context-fade">
      <div
        v-if="showMenu"
        ref="contextMenuRef"
        class="context-menu"
        :style="{ top: `${y}px`, left: `${x}px` }"
        @click.stop
      >
        <div
          v-for="item in contextItems"
          :key="item.action"
          :class="[
            'context-menu-item',
            {
              'context-menu-separator': item.type === 'separator',
              'context-menu-danger': item.danger,
            },
          ]"
          @click="item.type !== 'separator' && handleAction(item.action)"
        >
          <template v-if="item.type !== 'separator'">
            <i v-if="item.icon" :class="`icon-${item.icon}`"></i>
            <span>{{ item.label }}</span>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useContextMenuStore } from "@/stores/contexMenu";
import { storeToRefs } from "pinia";
import { nextTick, useTemplateRef, watch } from "vue";

const contextMenuStore = useContextMenuStore();
const { showMenu, x, y, contextItems } = storeToRefs(contextMenuStore);
const { setContextRef, handleAction } = contextMenuStore;

const contextMenuRef = useTemplateRef("contextMenuRef");

watch(x, async (newVal) => {
  await nextTick();
  if (newVal && contextMenuRef.value) {
    setContextRef(contextMenuRef);
  }
});
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); */
  min-width: 14rem;
  z-index: 10000;
  overflow: hidden;
  transition: all 0.3s ease;
}

.context-menu-item {
  padding: 0.71rem;
  display: flex;
  align-items: center;
  gap: 0.71rem;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 1rem;
  color: var(--text);
}

.context-menu-item:hover:not(.context-menu-separator) {
  background-color: var(--muted-accent);
}

.context-menu-item.context-menu-danger {
  color: var(--destructive);
}

.context-menu-item.context-menu-danger:hover {
  background-color: var(--muted-destructive);
}

.context-menu-separator {
  height: 0.07rem;
  background-color: var(--border-color);
  padding: 0;
  cursor: default;
}

.context-fade-enter-active,
.context-fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.context-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
}

.context-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
