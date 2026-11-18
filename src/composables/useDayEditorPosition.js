import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { arrow, autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom'
import { useThemeStore } from '@/stores/themes'

export function useDayEditorPosition({ editor, panel, arrowElement, onAnchorUpdate, onPositioned }) {
  const theme = useThemeStore()
  const position = ref({})
  const arrowStyle = ref({ visibility: 'hidden' })
  const placement = ref('right')
  const ready = ref(false)
  const side = computed(() => `on-${placement.value.split('-')[0]}`)
  let cleanup, generation = 0, request = 0

  const stop = () => {
    generation++
    request++
    cleanup?.()
    cleanup = null
  }

  watch(() => [editor.active, editor.anchorElement, theme.isMobile], async ([session, anchor], previous) => {
    stop()
    if (session !== previous?.[0]) ready.value = false
    if (!session) { onAnchorUpdate(null); return }
    const version = generation
    await nextTick()
    const floating = panel.value
    if (version !== generation || editor.active !== session || !floating) return
    const cell = anchor?.isConnected ? anchor : null
    if (anchor && !cell) { editor.setAnchorElement(null); return }
    const mobile = theme.isMobile
    const bottomSheet = mobile || !cell
    // A viewport reference keeps drafts accessible while calendar refresh replaces the cell.
    const reference = bottomSheet ? {
      contextElement: cell || document.documentElement,
      getBoundingClientRect() {
        const viewport = window.visualViewport
        const x = (viewport?.offsetLeft || 0) + (viewport?.width || window.innerWidth) / 2
        const y = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight)
        return { x, y, left: x, right: x, top: y, bottom: y, width: 0, height: 0 }
      },
    } : cell
    const current = () => version === generation && editor.active === session && panel.value === floating
      && theme.isMobile === mobile && editor.anchorElement === cell

    const update = async () => {
      if (!current()) return
      if (cell && !cell.isConnected) {
        onAnchorUpdate(null)
        if (editor.anchorElement === cell) editor.setAnchorElement(null)
        return
      }
      onAnchorUpdate(cell)
      const sequence = ++request
      const valid = () => current() && sequence === request && (!cell || cell.isConnected)
      try {
        const result = await computePosition(reference, floating, {
          strategy: 'fixed',
          placement: bottomSheet ? 'top' : 'right',
          middleware: [
            offset(12),
            ...(!bottomSheet ? [flip({ padding: 12, fallbackPlacements: ['left', 'bottom', 'top'], rootBoundary: 'viewport' })] : []),
            shift({ padding: 12, crossAxis: true, rootBoundary: 'viewport' }),
            size({
              padding: 12,
              rootBoundary: 'viewport',
              apply({ availableWidth, availableHeight, elements }) {
                if (!valid()) return
                elements.floating.style.setProperty('--editor-width', `${Math.max(0, availableWidth)}px`)
                elements.floating.style.setProperty('--editor-height', `${Math.max(0, availableHeight)}px`)
              },
            }),
            ...(!bottomSheet && arrowElement.value ? [arrow({ element: arrowElement.value, padding: 10 })] : []),
          ],
        })
        if (!valid()) return
        position.value = { position: result.strategy, left: `${result.x}px`, top: `${result.y}px` }
        placement.value = result.placement
        const data = result.middlewareData.arrow
        const edge = { right: 'left', left: 'right', bottom: 'top', top: 'bottom' }[result.placement.split('-')[0]]
        arrowStyle.value = !bottomSheet && data ? {
          left: data.x == null ? '' : `${data.x}px`, top: data.y == null ? '' : `${data.y}px`,
          right: '', bottom: '', [edge]: '-7px', visibility: 'visible',
        } : { visibility: 'hidden' }
        ready.value = true
        await nextTick()
        if (valid()) onPositioned(session)
      } catch (error) {
        if (!valid()) return
        console.error('Не удалось вычислить положение редактора дня:', error)
        position.value = {}
        arrowStyle.value = { visibility: 'hidden' }
        ready.value = true
      }
    }
    cleanup = autoUpdate(reference, floating, update, {
      ancestorScroll: true, ancestorResize: true, elementResize: true, layoutShift: true,
    })
  }, { flush: 'post', immediate: true })

  onBeforeUnmount(stop)
  return { position, arrowStyle, side, ready }
}
