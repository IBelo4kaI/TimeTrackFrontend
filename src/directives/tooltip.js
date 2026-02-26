export const vTooltip = {
  mounted(el, binding) {
    const tooltip = document.createElement('div')
    tooltip.className = 'v-tooltip'

    const content = document.createElement('div')
    content.className = 'v-tooltip-content'

    tooltip.appendChild(content)
    document.body.appendChild(tooltip)

    let showTimer = null
    let hideTimer = null

    const getOptions = () => {
      if (typeof binding.value === 'string') {
        return {
          content: binding.value,
          position: 'top',
          delay: 200,
          offset: 8,
          html: false,
        }
      }

      return {
        content: binding.value?.content ?? '',
        position: binding.value?.position ?? 'top',
        delay: binding.value?.delay ?? 200,
        offset: binding.value?.offset ?? 8,
        html: binding.value?.html ?? false,
      }
    }

    const computePosition = () => {
      const options = getOptions()
      const rect = el.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const offset = options.offset
      const padding = 8

      const fits = {
        top: rect.top >= tooltipRect.height + offset + padding,
        bottom:
          window.innerHeight - rect.bottom >=
          tooltipRect.height + offset + padding,
        left: rect.left >= tooltipRect.width + offset + padding,
        right:
          window.innerWidth - rect.right >=
          tooltipRect.width + offset + padding,
      }

      let placement = options.position
      if (!fits[placement]) {
        placement = Object.keys(fits).find((p) => fits[p]) || options.position
      }

      // Убираем старые классы позиций
      tooltip.dataset.placement = placement

      let top = 0
      let left = 0

      switch (placement) {
        case 'top':
          top = rect.top - tooltipRect.height - offset
          left = rect.left + (rect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = rect.bottom + offset
          left = rect.left + (rect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = rect.top + (rect.height - tooltipRect.height) / 2
          left = rect.left - tooltipRect.width - offset
          break
        case 'right':
          top = rect.top + (rect.height - tooltipRect.height) / 2
          left = rect.right + offset
          break
      }

      left = Math.max(
        padding,
        Math.min(left, window.innerWidth - tooltipRect.width - padding)
      )
      top = Math.max(
        padding,
        Math.min(top, window.innerHeight - tooltipRect.height - padding)
      )

      tooltip.style.top = `${top + window.scrollY}px`
      tooltip.style.left = `${left + window.scrollX}px`
    }

    const updatePosition = () => computePosition()

    const show = () => {
      const options = getOptions()
      if (!options.content) return

      clearTimeout(hideTimer)
      clearTimeout(showTimer)

      showTimer = setTimeout(() => {
        if (options.html) {
          content.innerHTML = options.content
        } else {
          content.textContent = options.content
        }

        // 1. Делаем видимым без анимации, чтобы можно было измерить размеры
        tooltip.style.visibility = 'hidden'
        tooltip.classList.remove('v-tooltip--visible')
        tooltip.classList.add('v-tooltip--active')

        // 2. После layout считаем позицию
        requestAnimationFrame(() => {
          computePosition()

          // 3. Запускаем анимацию появления
          requestAnimationFrame(() => {
            tooltip.style.visibility = ''
            tooltip.classList.add('v-tooltip--visible')
          })
        })

        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
      }, options.delay)
    }

    const hide = () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)

      tooltip.classList.remove('v-tooltip--visible')

      hideTimer = setTimeout(() => {
        tooltip.classList.remove('v-tooltip--active')
      }, 200) // совпадает с transition duration

      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }

    const resizeObserver = new ResizeObserver(() => {
      if (tooltip.classList.contains('v-tooltip--active')) {
        updatePosition()
      }
    })

    resizeObserver.observe(document.documentElement)
    resizeObserver.observe(el)

    el._tooltip = tooltip
    el._tooltipShow = show
    el._tooltipHide = hide
    el._tooltipResizeObserver = resizeObserver

    el.addEventListener('mouseenter', show)
    el.addEventListener('mouseleave', hide)
    el.addEventListener('focus', show)
    el.addEventListener('blur', hide)
  },

  updated(el, binding) {
    // Обновляем binding при изменении значения
    el._tooltipBinding = binding
  },

  unmounted(el) {
    el._tooltipResizeObserver?.disconnect()

    el.removeEventListener('mouseenter', el._tooltipShow)
    el.removeEventListener('mouseleave', el._tooltipHide)
    el.removeEventListener('focus', el._tooltipShow)
    el.removeEventListener('blur', el._tooltipHide)

    el._tooltip?.remove()

    delete el._tooltip
    delete el._tooltipShow
    delete el._tooltipHide
    delete el._tooltipResizeObserver
  },
}

export default {
  install(app) {
    app.directive('tooltip', vTooltip)
  },
}
