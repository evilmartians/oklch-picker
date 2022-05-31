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

  if (input.type === 'number') {
    input.addEventListener('keydown', onKeyDown)
    input.addEventListener('input', onInput)
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
