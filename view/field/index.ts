let fields = document.querySelectorAll<HTMLDivElement>('.field')
let meta = document.querySelector<HTMLMetaElement>('meta[name=viewport]')!

export function setValid(input: HTMLInputElement): void {
  input.removeAttribute('aria-invalid')
  input.setCustomValidity('')
  // input.reportValidity()
}

export function setInvalid(input: HTMLInputElement, message: string): void {
  input.setAttribute('aria-invalid', 'true')
  input.setCustomValidity(message)
  // input.reportValidity()
}

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

export function toggleWarning(input: HTMLInputElement, toggle: boolean): void {
  input.classList.toggle('is-warning', toggle)
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
    action: 'decrease' | 'increase' | 'setMaximum' | 'setMinimum'
  }
}

let currentNotifyCb = (): void => {}
let pinchTimer: number

function useSpinButton(input: HTMLInputElement): void {
  let increase = input.nextElementSibling as HTMLButtonElement
  let decrease = increase.nextElementSibling as HTMLButtonElement
  let pattern = new RegExp(input.getAttribute('pattern')!)

  function changeNotice(type: SpinEvent['detail']['action']): void {
    if (/[0-9]/.test(input.value.charAt(input.value.length - 1))) {
      setValid(input)
      input.dispatchEvent(new CustomEvent('spin', { detail: { action: type } }))
    } else {
      setInvalid(input, 'Invalid number')
    }
  }

  function onPressed(e: MouseEvent): void {
    if (e.button !== 0) return
    e.preventDefault()

    if (document.activeElement !== input) {
      input.focus()
    }

    let target = e.target as HTMLButtonElement
    let increased = target === increase

    window.addEventListener('mouseup', onDispose)
    target.addEventListener('mouseleave', onDispose)

    currentNotifyCb = () => {
      if (increased) {
        changeNotice('increase')
      } else {
        changeNotice('decrease')
      }
    }

    onPinchButton(400)
  }

  function onPinchButton(delay: number): void {
    clearTimeout(pinchTimer)
    currentNotifyCb()
    pinchTimer = setTimeout(() => {
      onPinchButton(50)
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
    }
  }

  function onDispose(): void {
    clearTimeout(pinchTimer)
    window.removeEventListener('mouseup', onDispose)
    increase.removeEventListener('mouseleave', onDispose)
    decrease.removeEventListener('mouseleave', onDispose)
  }

  function onFieldInput(e: Event): void {
    onInput(e)

    if (e instanceof InputEvent) {
      let value = input.value
      let caretPosition = input.selectionStart!

      if (!pattern.test(value)) {
        input.value = removeByPosition(value, caretPosition - 1)
        setInvalid(input, 'Invalid number')
      } else {
        setValid(input)
      }
    }

    input.setAttribute('aria-valuenow', input.value)
  }

  increase.addEventListener('mousedown', onPressed)
  decrease.addEventListener('mousedown', onPressed)

  input.addEventListener('keydown', onKeyPressed)
  input.addEventListener('input', onFieldInput)
  input.addEventListener('blur', onDispose)
}
