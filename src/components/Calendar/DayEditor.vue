<template>
  <Teleport to="body">
    <Transition name="day-editor-fade">
      <ModalLayout
        v-if="editor.active"
        class="day-editor-modal"
        :class="{ 'mixed-hours': editor.isGroup && editor.mixed.hours }"
        :style="viewportStyle"
        width="360px"
        :autofocus="false"
        title="Быстрое редактирование дня"
        @close="requestClose"
      >
        <div class="editor-content">
          <p v-if="editor.isGroup" class="group-summary">
            Выбрано дней: {{ editor.selectedCount }}
            <span v-if="editor.mixed.userTimeTypeId"> · Разные типы</span>
            <span v-if="editor.mixed.workLocation"> · Разное место работы</span>
          </p>
          <div class="hours-row">
            <label for="day-editor-hours">Количество часов</label>
            <div class="hours-control" :class="{ 'without-steps': !showHourSteps }">
              <ButtonUI
                type="muted"
                icon="fa-light fa-angle-left"
                aria-label="Уменьшить часы"
                :aria-hidden="!showHourSteps"
                :tabindex="showHourSteps ? undefined : -1"
                :disabled="editor.deleting || editor.groupBlockedCount > 0 || !showHourSteps || Number(editor.draft.hours) <= 0"
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
                  editor.draft.hours != null && editor.draft.hours !== '' && Number.isFinite(Number(editor.draft.hours))
                    ? Number(editor.draft.hours)
                    : undefined
                "
                @keydown.up.prevent="step(0.5)"
                @keydown.down.prevent="step(-0.5)"
                :value="editor.draft.hours"
                :placeholder="editor.mixed.hours ? 'Разные значения' : ''"
                :title="editor.mixed.hours ? 'Введите общее количество часов перед использованием стрелок' : ''"
                :disabled="editor.deleting || editor.groupBlockedCount > 0"
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
                :aria-hidden="!showHourSteps"
                :tabindex="showHourSteps ? undefined : -1"
                :disabled="
                  editor.deleting || editor.groupBlockedCount > 0 || !showHourSteps || Number(editor.draft.hours) >= 24
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
                !editor.canApplyType(type.id)
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
                  editor.canChangeLocation &&
                  editor.draft.workLocation === location.value,
              }"
              :aria-pressed="
                editor.canChangeLocation &&
                editor.draft.workLocation === location.value
              "
              :disabled="
                editor.deleting || !editor.canChangeLocation
              "
              @click="editor.change('workLocation', location.value)"
            >
              {{ location.label }}
            </ButtonUI>
          </div>
          <p v-if="editor.isGroup && !editor.groupBlockedCount && (editor.fixedTypeCount || editor.locationSkippedCount)" class="group-hint">
            <span v-if="editor.fixedTypeCount">Тип нельзя менять у {{ editor.fixedTypeCount }} дат. </span>
            <span v-if="editor.locationSkippedCount">Место работы не применяется к {{ editor.locationSkippedCount }} нерабочим или пустым датам.</span>
          </p>
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
              v-if="editor.hasRecords"
              type="button"
              class="text-action delete-action"
              :disabled="editor.saving || editor.deleting"
              @click="editor.remove"
            >
              {{ editor.isGroup ? 'Очистить выбранные' : editor.vacation ? 'Обнулить часы' : 'Удалить' }}
            </button>
          </div>
          <button v-if="editor.isGroup && editor.dirty && !editor.saving" type="button" class="text-action"
            title="Отменить только оставшиеся правки. Уже подтверждённые изменения сохранятся." @click="editor.discardGroupChanges">Отменить оставшиеся правки</button>
          <p
            v-if="
              !editor.saving &&
              (editor.error || editor.groupBlockedCount || (editor.dirty && editor.validation))
            "
            class="field-error"
            role="alert"
          >
            {{ editor.error || editor.validation }}
          </p>
        </div>
      </ModalLayout>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ButtonUI from '@/components/ButtonUI.vue'
import { useDayEditorStore } from '@/stores/dayEditor'
import { useDayTypesStore } from '@/stores/dayTypes'
import ModalLayout from '@/layouts/ModalLayout.vue'

const editor = useDayEditorStore()
const types = useDayTypesStore()
const viewportStyle = ref({})
let closing = null, previousOverflow = null
const hoursInput = ref(null)
const typeRow = ref(null)
const showHourSteps = computed(() => !(editor.isGroup && editor.mixed.hours)
  && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(String(editor.draft.hours))
  && Number.isFinite(Number(editor.draft.hours))
  && Number(editor.draft.hours) >= 0 && Number(editor.draft.hours) <= 24)
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
const step = (amount) => {
  if (!showHourSteps.value || editor.groupBlockedCount) return
  editor.change('hours', Math.min(24, Math.max(0, Number(editor.draft.hours) + amount)))
}
const requestClose = () => {
  if (!closing) closing = editor.close().finally(() => { closing = null })
  return closing
}
const updateViewport = () => {
  const viewport = window.visualViewport
  viewportStyle.value = viewport ? {
    left: `${viewport.offsetLeft}px`, top: `${viewport.offsetTop}px`,
    width: `${viewport.width}px`, height: `${viewport.height}px`,
    right: 'auto', bottom: 'auto',
    '--editor-viewport-height': `${viewport.height}px`,
  } : {}
}
const stopViewport = () => {
  window.visualViewport?.removeEventListener('resize', updateViewport)
  window.visualViewport?.removeEventListener('scroll', updateViewport)
  window.removeEventListener('resize', updateViewport)
  if (previousOverflow !== null) document.body.style.overflow = previousOverflow
  previousOverflow = null
}
watch(() => editor.active, async (active, previous) => {
  if (active === previous) return
  stopViewport()
  if (!active) return
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  updateViewport()
  window.visualViewport?.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('scroll', updateViewport)
  window.addEventListener('resize', updateViewport)
  await nextTick()
  if (editor.active !== active) return
  revealType(typeRow.value?.querySelector('[aria-pressed="true"]'), true)
  if (window.innerWidth > 768) {
    hoursInput.value?.focus({ preventScroll: true })
    hoursInput.value?.select()
  }
}, { flush: 'post', immediate: true })
const preventExit = (event) => {
  if (editor.dirty || editor.saving || editor.uncertain) {
    event.preventDefault()
    event.returnValue = ''
  }
}
window.addEventListener('beforeunload', preventExit)
onBeforeUnmount(() => {
  stopViewport()
  window.removeEventListener('beforeunload', preventExit)
})
</script>

<style scoped>
.day-editor-modal {
  z-index: 10001;
  padding: 12px;
  animation: none;
}
.day-editor-modal :deep(.modal-container) {
  min-width: 0;
  max-height: calc(var(--editor-viewport-height, 100dvh) - 24px);
  padding: .8rem;
  gap: .55rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 .3rem 1.4rem #0002;
}
.day-editor-modal :deep(.modal-header) {
  flex-shrink: 0;
  justify-content: flex-end;
}
.day-editor-modal :deep(.header-info) { display: none; }
.day-editor-fade-enter-active,
.day-editor-fade-leave-active { transition: opacity 140ms ease; }
.day-editor-fade-enter-from,
.day-editor-fade-leave-to { opacity: 0; }
.day-editor-fade-leave-active { pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .day-editor-fade-enter-active,
  .day-editor-fade-leave-active { transition: none; }
}
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
.group-summary { margin: 0; font-size: .8rem; color: var(--muted-text); }
.group-hint { margin: 0; font-size: .75rem; line-height: 1.35; color: var(--muted-text); }
.mixed-hours .hours-control input { font-size: .85rem; }
.hours-row {
  min-height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}
.hours-row label { min-width: 0; }
.hours-control {
  display: grid;
  grid-template-columns: 2.2rem minmax(0, 1fr) 2.2rem;
  flex: 0 1 9rem;
  width: 9rem;
  min-width: 0;
  max-width: 100%;
  align-items: center;
  transition: grid-template-columns 200ms ease;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}
.hours-control button {
  width: 100%;
  min-width: 0;
  height: 2.25rem;
  padding: 0;
  justify-content: center;
  overflow: hidden;
  transform: scale(1);
  transition: opacity 200ms ease, transform 200ms ease;
  border: 0;
  border-radius: 0;
  font: inherit;
}
.hours-control.without-steps { grid-template-columns: 0 minmax(0, 1fr) 0; }
.hours-control.without-steps button {
  opacity: 0;
  transform: scale(.9);
  pointer-events: none;
}
.hours-control input {
  width: 100%;
  min-width: 0;
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
@media (prefers-reduced-motion: reduce) {
  .hours-control, .hours-control button { transition: none; }
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
.editor-content :is(button, textarea, .day-types):focus-visible {
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
</style>
