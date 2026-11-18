<template>
  <Teleport to="body">
    <Transition name="day-editor-fade">
      <div
        v-if="editor.active"
        ref="overlay"
        class="day-editor-overlay"
        aria-hidden="true"
        @click.stop="editor.close"
        @contextmenu.prevent
        @wheel="scrollCalendar"
      ></div>
    </Transition>
    <Transition name="day-editor-fade">
      <section
        v-if="editor.active"
        ref="panel"
        class="day-editor"
        :class="side"
        :style="[position, { visibility: ready ? 'visible' : 'hidden' }]"
        role="dialog"
        aria-label="Быстрое редактирование дня"
        tabindex="-1"
        @mousedown.stop
        @touchstart.stop
      >
        <span ref="arrowElement" class="editor-arrow" :style="arrowStyle" aria-hidden="true"></span>
        <div class="editor-content">
          <div class="hours-row">
            <label for="day-editor-hours">Количество часов</label>
            <div class="hours-control">
              <ButtonUI
                type="muted"
                icon="fa-light fa-angle-left"
                aria-label="Уменьшить часы"
                :disabled="editor.deleting || Number(editor.draft.hours) <= 0"
                @click="step(-0.5)"
              />
              <input
                id="day-editor-hours"
                ref="hoursInput"
                type="text"
                inputmode="decimal"
                role="spinbutton"
                aria-valuemin="0"
                aria-valuemax="24"
                :aria-valuenow="
                  Number.isFinite(Number(editor.draft.hours))
                    ? Number(editor.draft.hours)
                    : undefined
                "
                @keydown.up.prevent="step(0.5)"
                @keydown.down.prevent="step(-0.5)"
                :value="editor.draft.hours"
                :disabled="editor.deleting"
                @input="
                  editor.change(
                    'hours',
                    $event.target.value.replace(',', '.')
                  )
                "
              />
              <ButtonUI
                type="muted"
                icon="fa-light fa-angle-right"
                aria-label="Увеличить часы"
                :disabled="
                  editor.deleting || Number(editor.draft.hours) >= 24
                "
                @click="step(0.5)"
              />
            </div>
          </div>
          <div
            ref="typeRow"
            class="segments day-types"
            role="group"
            aria-label="Тип дня"
            tabindex="0"
            @keydown="navigateTypes"
          >
            <ButtonUI
              v-for="type in dayTypes"
              :key="type.id"
              type="muted"
              :class="{ selected: editor.draft.userTimeTypeId === type.id }"
              :aria-pressed="editor.draft.userTimeTypeId === type.id"
              :disabled="
                !canSwitchType ||
                !editor.editableTypes.some((item) => item.id === type.id)
              "
              @click="editor.change('userTimeTypeId', type.id)"
            >
              {{ type.name }}
            </ButtonUI>
          </div>
          <div class="segments" role="group" aria-label="Место работы">
            <ButtonUI
              v-for="location in locations"
              :key="location.value"
              type="muted"
              :class="{
                selected:
                  editor.draft.userTimeTypeId === editor.workId &&
                  editor.draft.workLocation === location.value,
              }"
              :aria-pressed="
                editor.draft.userTimeTypeId === editor.workId &&
                editor.draft.workLocation === location.value
              "
              :disabled="
                editor.deleting ||
                editor.draft.userTimeTypeId !== editor.workId
              "
              @click="editor.change('workLocation', location.value)"
            >
              {{ location.label }}
            </ButtonUI>
          </div>
          <textarea
            v-if="editor.needsReason"
            rows="1"
            maxlength="4000"
            :value="editor.draft.comment"
            aria-label="Обязательная причина изменения руководителем"
            placeholder="Причина изменения (обязательно)"
            @input="editor.change('comment', $event.target.value)"
          ></textarea>
          <div class="editor-footer">
            <span
              class="save-status"
              aria-live="polite"
              :class="{
                failed: editor.error,
                saved: editor.saved && !editor.dirty,
              }"
            >
              <template v-if="editor.saving">Сохраняется…</template>
              <template v-else-if="editor.error">Ошибка сохранения</template>
              <template v-else-if="editor.dirty">
                {{ editor.validation ? 'Проверьте поля' : 'Ожидание…' }}
              </template>
              <template v-else-if="editor.saved">Сохранено</template>
            </span>
            <button
              v-if="editor.error"
              type="button"
              class="text-action"
              :disabled="editor.saving"
              @click="editor.flush"
            >
              Повторить
            </button>
            <button
              v-if="editor.active.day.userTimeId"
              type="button"
              class="text-action delete-action"
              :disabled="editor.saving || editor.deleting"
              @click="editor.remove"
            >
              {{ editor.vacation ? 'Обнулить часы' : 'Удалить' }}
            </button>
          </div>
          <p
            v-if="
              !editor.saving &&
              (editor.error || (editor.dirty && editor.validation))
            "
            class="field-error"
            role="alert"
          >
            {{ editor.error || editor.validation }}
          </p>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { useDayEditorStore } from '@/stores/dayEditor'
import { useDayTypesStore } from '@/stores/dayTypes'
import { useDayEditorPosition } from '@/composables/useDayEditorPosition'

const editor = useDayEditorStore()
const types = useDayTypesStore()
const panel = ref(null)
const overlay = ref(null)
let calendarSurface = null, previousFocus, focusedSession
const arrowElement = ref(null)
const hoursInput = ref(null)
const typeRow = ref(null)
const locations = [
  { value: 'office', label: 'Офис' },
  { value: 'remote', label: 'Удалённо' },
]
const dayTypes = computed(() => {
  const available = editor.editableTypes
  if (available.some((type) => type.id === editor.draft.userTimeTypeId))
    return available
  const current = types.getDayTypeById(editor.draft.userTimeTypeId)
  return current ? [...available, current] : available
})
const revealType = (button, centered = false) => {
  const row = typeRow.value
  if (!row || !button) return
  if (centered)
    row.scrollLeft =
      button.offsetLeft - (row.clientWidth - button.offsetWidth) / 2
  else {
    const bounds = row.getBoundingClientRect(),
      item = button.getBoundingClientRect()
    if (item.left < bounds.left) row.scrollLeft -= bounds.left - item.left
    else if (item.right > bounds.right)
      row.scrollLeft += item.right - bounds.right
  }
}
const navigateTypes = (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const buttons = [...typeRow.value.querySelectorAll('button:not(:disabled)')]
  if (!buttons.length) {
    if (event.key === 'Home') typeRow.value.scrollLeft = 0
    else if (event.key === 'End')
      typeRow.value.scrollLeft = typeRow.value.scrollWidth
    else typeRow.value.scrollLeft += event.key === 'ArrowRight' ? 80 : -80
    return
  }
  const current = buttons.indexOf(document.activeElement)
  const index =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? buttons.length - 1
        : current < 0
          ? event.key === 'ArrowRight'
            ? 0
            : buttons.length - 1
          : Math.max(
              0,
              Math.min(
                buttons.length - 1,
                current + (event.key === 'ArrowRight' ? 1 : -1)
              )
            )
  buttons[index].focus({ preventScroll: true })
  revealType(buttons[index])
}
const canSwitchType = computed(
  () => !editor.deleting && !editor.managerSave && editor.active?.day.isEditType
)
const step = (amount) =>
  editor.change(
    'hours',
    Math.min(24, Math.max(0, Number(editor.draft.hours) + amount))
  )
const updateCalendarSurface = (cell) => {
  calendarSurface = cell?.closest('.calendar') || null
}
const { position, arrowStyle, side, ready } = useDayEditorPosition({
  editor, panel, arrowElement, onAnchorUpdate: updateCalendarSurface,
  onPositioned(session) {
    if (focusedSession === session || editor.active !== session) return
    focusedSession = session
    revealType(typeRow.value?.querySelector('[aria-pressed="true"]'), true)
    if (window.innerWidth > 768) {
      hoursInput.value?.focus({ preventScroll: true })
      hoursInput.value?.select()
    } else panel.value?.focus({ preventScroll: true })
  },
})
// Forward wheel input to the covered calendar; leave page scrolling available at its edges.
const scrollCalendar = (event) => {
  const surface = calendarSurface
  if (!surface) return
  const scale =
    event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? surface.clientHeight
        : 1
  const dy = event.deltaY * scale,
    dx = event.deltaX * scale
  const canScrollY =
    dy < 0
      ? surface.scrollTop > 0
      : surface.scrollTop + surface.clientHeight < surface.scrollHeight
  const canScrollX =
    dx < 0
      ? surface.scrollLeft > 0
      : surface.scrollLeft + surface.clientWidth < surface.scrollWidth
  if ((dy && canScrollY) || (dx && canScrollX)) {
    event.preventDefault()
    surface.scrollBy({ top: dy, left: dx })
  }
}
watch(() => editor.active, (active, previous) => {
  if (active === previous) return
  focusedSession = null
  if (active) previousFocus = document.activeElement
  else previousFocus?.focus?.()
}, { flush: 'post' })
// Wait for persistence before an outside action can change the calendar context.
const outside = (event) => {
  if (!editor.active || panel.value?.contains(event.target)) return
  // A swipe on the backdrop may scroll; only the resulting tap closes it.
  if (
    event.type === 'pointerdown' &&
    overlay.value?.contains(event.target)
  )
    return
  event.preventDefault()
  event.stopImmediatePropagation()
  void editor.close()
}
const keydown = (event) => {
  if (!editor.active) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    void editor.close()
  } else if (!panel.value?.contains(event.target)) {
    outside(event)
  }
}
const preventExit = (event) => {
  if (editor.dirty || editor.saving || editor.uncertain) {
    event.preventDefault()
    event.returnValue = ''
  }
}
document.addEventListener('pointerdown', outside, true)
document.addEventListener('click', outside, true)
document.addEventListener('keydown', keydown, true)
window.addEventListener('beforeunload', preventExit)
onBeforeUnmount(() => {
  calendarSurface = null
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('click', outside, true)
  document.removeEventListener('keydown', keydown, true)
  window.removeEventListener('beforeunload', preventExit)
})
</script>

<style scoped>
/* Siblings in the root stacking context; the original day occupies layer 10002. */
.day-editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: #9c9c9c50;
  pointer-events: auto;
  touch-action: pan-y;
}
.day-editor-fade-enter-active,
.day-editor-fade-leave-active {
  transition: opacity 140ms ease;
}
.day-editor-fade-enter-from,
.day-editor-fade-leave-to {
  opacity: 0;
}
.day-editor-overlay.day-editor-fade-leave-active,
.day-editor.day-editor-fade-leave-active {
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .day-editor-fade-enter-active,
  .day-editor-fade-leave-active {
    transition: none;
  }
}
.day-editor {
  position: fixed;
  z-index: 10003;
  pointer-events: auto;
  left: 12px;
  top: 12px;
  width: min(300px, var(--editor-width, calc(100vw - 24px)));
  max-height: var(--editor-height, calc(100dvh - 24px));
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.8rem;
  background: var(--foreground);
  color: var(--text);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 0.3rem 1.4rem #0002;
  outline: none;
}
.editor-arrow {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--foreground);
  transform: rotate(45deg);
  pointer-events: none;
}
.on-right .editor-arrow { border-left: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
.on-left .editor-arrow { border-right: 1px solid var(--border-color); border-top: 1px solid var(--border-color); }
.on-bottom .editor-arrow { border-left: 1px solid var(--border-color); border-top: 1px solid var(--border-color); }
.on-top .editor-arrow { border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
.editor-content {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.editor-content > * {
  flex-shrink: 0;
}
.hours-row {
  min-height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}
.hours-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}
.hours-control button {
  height: 2.25rem;
  padding: 0.35rem 0.65rem;
  border: 0;
  border-radius: 0;
  font: inherit;
}
.hours-control input {
  width: 4.5rem;
  padding: 0.3rem;
  border: 0;
  border-inline: 1px solid var(--border-color);
  text-align: center;
  font: inherit;
  color: var(--text);
  background: var(--foreground);
  appearance: textfield;
  outline: none;
}
.hours-control input::-webkit-inner-spin-button,
.hours-control input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
.segments {
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  background: var(--background);
  border-radius: var(--border-radius);
}
.segments button {
  flex: 1;
  justify-content: center;
  min-width: 0;
  height: 2.2rem;
  padding: 0.2rem 0.35rem;
  border-color: transparent;
  font: inherit;
  white-space: nowrap;
}
.segments button:not(.selected) {
  background: transparent;
}
.segments .selected {
  background: var(--muted-accent);
  color: var(--accent);
  border-color: var(--border-color);
}
.day-types {
  position: relative;
  min-width: 0;
  max-width: 100%;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;
  overscroll-behavior-x: contain;
  touch-action: pan-x;
}
.day-types button {
  flex: 0 0 auto;
}
.day-editor :is(button, textarea, .day-types):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
button:disabled {
  cursor: default;
  opacity: 0.5;
}
textarea {
  width: 100%;
  min-height: 2.2rem;
  max-height: 6rem;
  resize: vertical;
  flex-shrink: 0;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font: inherit;
  font-size: 0.9rem;
  color: var(--text);
  background: var(--foreground);
}
.editor-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem 0.65rem;
  font-size: 0.8rem;
  color: var(--muted-text);
}
.text-action {
  padding: 0.15rem 0;
  font: inherit;
  color: var(--muted-text);
  cursor: pointer;
}
.text-action:hover {
  color: var(--accent);
}
.delete-action {
  margin-left: auto;
}
.delete-action:hover {
  color: var(--destructive);
}
.save-status {
  margin-left: auto;
}
.saved {
  color: var(--success);
}
.failed,
.field-error {
  color: var(--destructive);
}
.field-error {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
@media (max-width: 768px) {
  .day-editor {
    width: min(420px, var(--editor-width, calc(100vw - 24px)));
  }
}
</style>
