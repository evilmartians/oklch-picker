import { toggle } from '../code/index.js'

let fields = document.querySelectorAll<HTMLDivElement>('.field')
let meta = document.querySelector<HTMLMetaElement>('meta[name=viewport]')!

let originViewport = meta.content

if (/iPhone/.test(navigator.userAgent)) {
  // The hack to prevent zoom on field focus
  function onMouseOver(): void {
    meta.content = originViewport + ',maximum-scale=1,user-scalable=0'
  }

  function onBlur(): void {
    meta.content = originViewport
  }

  for (let field of fields) {
    let input = field.querySelector<HTMLInputElement>('input')!
    input.addEventListener('mouseover', onMouseOver)
    input.addEventListener('blur', onBlur)
  }
}

function onInput(e: Event): void {
  let input = e.target as HTMLInputElement
  input.removeEventListener('mouseup', onMouseUp)
}

// The hack to prevent loosing selected text on click
function onMouseUp(e: MouseEvent): void {
  e.preventDefault()
  let input = e.target as HTMLInputElement
  input.removeEventListener('mouseup', onMouseUp)
}

function onFocus(e: FocusEvent): void {
  let input = e.target as HTMLInputElement
  input.select()

  input.addEventListener('mouseup', onMouseUp)
  setTimeout(() => {
    input.addEventListener('mouseup', onMouseUp)
  }, 500)
}

function isSpecial(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.shiftKey || e.altKey || e.metaKey
}

function onKeyDown(e: KeyboardEvent): void {
  if (hotkeys[e.code] && !isSpecial(e)) {
    e.preventDefault()
    hotkeys[e.code]?.focus()
  }
}

let hotkeys: Partial<Record<string, HTMLInputElement>> = {}

for (let field of fields) {
  let input = field.querySelector<HTMLInputElement>('input')!
  input.addEventListener('focus', onFocus)

  if (input.getAttribute('role') === 'spinbutton') {
    useSpinButton(input)
  }

  let hotkey = `Key${field
    .querySelector('kbd')!
    .innerText.trim()
    .toUpperCase()}`
  hotkeys[hotkey] = input
}

function isInput(el: EventTarget | null): el is HTMLInputElement {
  return !!el && (el as Element).tagName === 'INPUT'
}

window.addEventListener('keyup', e => {
  if (isSpecial(e)) return
  if (e.target === document.body) {
    hotkeys[e.code]?.focus()
  } else if (isInput(e.target) && e.code === 'Escape') {
    e.target.blur()
  }
})

function removeByPosition(str: string, position: number): string {
  return str.slice(0, position) + str.slice(position + 1)
}

export interface SpinEvent extends Event {
  detail: {
    action: 'increase' | 'decrease' | 'setMinimum' | 'setMaximum'
  }
}

let draggableRect: DOMRect | null = null
let currentNotifyCb = (): void => {}
let pinchTimer: number

function useSpinButton(input: HTMLInputElement): void {
  let container = input.nextElementSibling!
  let increase = container.querySelector<HTMLButtonElement>('.is-increase')!
  let decrease = container.querySelector<HTMLButtonElement>('.is-decrease')!

  function changeNotice(type: SpinEvent['detail']['action']): void {
    if (/[0-9]/.test(input.value.charAt(input.value.length - 1))) {
      let event = new CustomEvent('spin', { detail: { action: type } })

      toggle(input, false)
      input.dispatchEvent(event)
    } else {
      toggle(input, true)
    }
  }

  function onPressed(e: MouseEvent): void {
    if (e.button !== 0) return
    e.preventDefault()

    let target = e.target as HTMLButtonElement
    let increased = target === increase

    window.addEventListener('mousemove', onDragging)
    window.addEventListener('mouseup', onDispose)

    currentNotifyCb = () => {
      if (increased) {
        changeNotice('increase')
      } else {
        changeNotice('decrease')
      }
    }

    draggableRect = target.getBoundingClientRect()
    onPinchButton(400)
  }

  function onDragging(e: MouseEvent): void {
    let target = e.target as HTMLButtonElement
    if (!draggableRect) return

    let increased = target === increase
    let boundary = increased ? draggableRect.bottom : draggableRect.top

    if (boundary > e.clientY) {
      currentNotifyCb = () => {
        changeNotice('increase')
      }
    } else {
      currentNotifyCb = () => {
        changeNotice('decrease')
      }
    }
  }

  function onPinchButton(delay: number): void {
    clearTimeout(pinchTimer)
    currentNotifyCb()
    pinchTimer = setTimeout(() => {
      onPinchButton(30)
    }, delay)
  }

  function onKeyPressed(e: KeyboardEvent): void {
    onKeyDown(e)

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        changeNotice('increase')
        break
      case 'ArrowDown':
        e.preventDefault()
        changeNotice('decrease')
        break
      case 'Home':
        e.preventDefault()
        changeNotice('setMinimum')
        break
      case 'End':
        e.preventDefault()
        changeNotice('setMaximum')
        break
    }
  }

  function onDispose(): void {
    clearTimeout(pinchTimer)
    window.removeEventListener('mouseup', onDispose)
    window.removeEventListener('mousemove', onDragging)
  }

  function onFieldInput(e: Event): void {
    onInput(e)

    if (e instanceof InputEvent) {
      let value = input.value
      let caretPosition = input.selectionStart!

      if (!input.checkValidity()) {
        input.value = removeByPosition(value, caretPosition - 1)
        toggle(input, true)
      } else {
        toggle(input, false)
      }
    }

    input.setAttribute('aria-valuenow', input.value)
  }

  increase.addEventListener('mousedown', onPressed)
  decrease.addEventListener('mousedown', onPressed)

  input.addEventListener('keydown', onKeyPressed)
  input.addEventListener('input', onFieldInput)
}
