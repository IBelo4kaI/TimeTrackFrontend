export class SelectingHelper {
  constructor(selectingStore) {
    this.selectingStore = selectingStore
  }

  onMouseDown(event) {
    // Только левая кнопка мыши
    if (event.button !== 0) return
  }

  onMouseUp(event) {
    if (event.button !== 0) return
    this.selectingStore.endSelection()
  }

  onMouseLeave() {
    this.selectingStore.endSelection()
  }

  onDayMouseDown(day, event) {
    if (event.button !== 0) return
    // Если зажат Shift, используем специальную логику
    if (event.shiftKey) {
      this.selectingStore.startSelection(day, true)
    } else if (event.ctrlKey) {
      this.selectingStore.startSelection(day, false, true)
    } else {
      this.selectingStore.startDragSelection(day)
    }
  }

  onDayMouseEnter(day) {
    // Обновляем выделение при перетаскивании
    if (this.selectingStore.isDragging) {
      this.selectingStore.updateDragSelection(day)
    }
  }
}
