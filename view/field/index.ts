import './index.css'

let fields = document.querySelectorAll<HTMLDivElement>('.field')

function onFocus(e: FocusEvent): void {
  let input = e.target as HTMLInputElement
  input.select()
}

let hotkeys: Partial<Record<string, HTMLInputElement>> = {}

for (let field of fields) {
  let input = field.querySelector<HTMLInputElement>('input')!
  input.addEventListener('focus', onFocus)
  let hotkey = field.querySelector('kbd')!.innerText.trim().toLowerCase()
  hotkeys[hotkey] = input
}

function isInput(el: EventTarget | null): el is HTMLInputElement {
  return !!el && (el as Element).tagName === 'INPUT'
}

window.addEventListener('keyup', e => {
  if (e.target === document.body) {
    hotkeys[e.key]?.focus()
  } else if (isInput(e.target) && e.key === 'Escape') {
    e.target.blur()
  }
})
