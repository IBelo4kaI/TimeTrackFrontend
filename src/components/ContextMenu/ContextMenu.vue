<template>
  <Teleport to="body">
    <Transition name="context-fade">
      <div
        v-if="showMenu"
        ref="contextMenuRef"
        class="context-menu"
        :style="{
          top: `${y}px`,
          left: `${x}px`,
          visibility: anchor && !isPlaced ? 'hidden' : 'visible',
        }"
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
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import { storeToRefs } from "pinia";
import { nextTick, onUnmounted, ref, useTemplateRef, watch } from "vue";

const contextMenuStore = useContextMenuStore();
const { showMenu, x, y, contextItems, anchor } = storeToRefs(contextMenuStore);
const { setContextRef, setPosition, handleAction } = contextMenuStore;

const contextMenuRef = useTemplateRef("contextMenuRef");

// Меню от кнопки: пока позиция не посчитана, оно скрыто, чтобы не мигать в
// точке клика
const isPlaced = ref(false);
let stopAutoUpdate = null;

const stopFloating = () => {
  stopAutoUpdate?.();
  stopAutoUpdate = null;
};

// Выравнивание по кнопке: под ней по правому краю, переворачивается вверх и
// сдвигается, если не влезает в окно
async function placeAtAnchor() {
  if (!anchor.value || !contextMenuRef.value) return;
  const { x: nx, y: ny } = await computePosition(
    anchor.value,
    contextMenuRef.value,
    {
      strategy: "fixed",
      placement: "bottom-end",
      middleware: [offset(4), flip({ padding: 8 }), shift({ padding: 8 })],
    }
  );
  setPosition(nx, ny);
  isPlaced.value = true;
}

// Следим и за кнопкой: меню могли переоткрыть от другой, пока оно уже показано
watch([showMenu, anchor], async ([open, anchorEl]) => {
  stopFloating();
  isPlaced.value = false;
  if (!open || !anchorEl) return;

  await nextTick();
  if (!contextMenuRef.value || !anchor.value) return;
  stopAutoUpdate = autoUpdate(anchor.value, contextMenuRef.value, placeAtAnchor);
});

// Меню по правому клику (без кнопки): у точки клика, не выходя за край окна
watch(x, async (newVal) => {
  if (anchor.value) return;
  await nextTick();
  if (newVal && contextMenuRef.value) {
    setContextRef(contextMenuRef);
  }
});

onUnmounted(stopFloating);
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: var(--foreground);
  border: 0.07rem solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 14rem;
  z-index: 10000;
  overflow: hidden;
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
