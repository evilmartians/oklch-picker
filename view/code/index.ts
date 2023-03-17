import type { OutputFormats } from '../../stores/settings.js'
import type { FormatsValue } from '../../stores/formats.js'

import {
  setCurrentFromColor,
  valueToColor,
  current
} from '../../stores/current.js'
import { parseAnything, formatLch } from '../../lib/colors.js'
import { formats, srgbFormats } from '../../stores/formats.js'
import { outputFormat } from '../../stores/settings.js'
import { visible } from '../../stores/visible.js'

let lch = document.querySelector<HTMLDivElement>('.code.is-lch')!
let lchInput = lch.querySelector<HTMLInputElement>('input')!

let rgb = document.querySelector<HTMLDivElement>('.code.is-rgb')!
let rgbInput = rgb.querySelector<HTMLInputElement>('input')!

let notePaste = document.querySelector<HTMLDivElement>('.code_note.is-paste')!
let noteFallback = document.querySelector<HTMLDivElement>(
  '.code_note.is-fallback'
)!

let format = document.querySelector<HTMLSelectElement>('.code select')!

function toggle(input: HTMLInputElement, invalid: boolean): void {
  if (invalid) {
    input.setAttribute('aria-invalid', 'true')
  } else {
    input.removeAttribute('aria-invalid')
  }
}

let prevValues = new Map<HTMLInputElement, string>()
let locked = new Map<HTMLInputElement, boolean>()

function setLch(): void {
  let value = current.get()
  let text = formatLch(valueToColor(value))
  prevValues.set(lchInput, text)
  lchInput.value = text
  toggle(lchInput, false)
}

function setRgb(): void {
  let { space } = visible.get()
  let type = outputFormat.get()
  let output = formats.get()[type]
  prevValues.set(rgbInput, output)
  rgbInput.value = output
  if (space !== 'srgb' && srgbFormats.has(type)) {
    notePaste.classList.add('is-hidden')
    noteFallback.classList.remove('is-hidden')
  } else {
    notePaste.classList.remove('is-hidden')
    noteFallback.classList.add('is-hidden')
  }
  toggle(rgbInput, false)
}

current.subscribe(() => {
  if (!locked.get(lchInput)) {
    setLch()
  }
})

visible.subscribe(() => {
  if (!locked.get(rgbInput)) {
    setRgb()
  }
})

function listenChanges(input: HTMLInputElement): void {
  function processChange(): void {
    let newValue = input.value.trim()

    if (newValue === prevValues.get(input)) return
    prevValues.set(input, newValue)

    let parsed = parseAnything(newValue)
    if (parsed) {
      setCurrentFromColor(parsed)
      toggle(input, false)
    } else {
      toggle(input, true)
    }
  }

  input.addEventListener('change', processChange)
  input.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      input.blur()
    } else {
      processChange()
    }
  })
  input.addEventListener('focus', () => {
    locked.set(input, true)
  })
  input.addEventListener('blur', () => {
    locked.set(input, false)
    if (input === lchInput) {
      setLch()
    } else {
      setRgb()
    }
  })
}

listenChanges(lchInput)
listenChanges(rgbInput)

format.value = outputFormat.get()
outputFormat.listen(value => {
  format.value = value
  rgb.ariaLabel = `${value} CSS code`
  setRgb()
})
format.addEventListener('change', () => {
  outputFormat.set(format.value as OutputFormats)
})

formats.subscribe(value => {
  for (let key in value) {
    let type = key as keyof FormatsValue
    if (type !== 'hex/rgba') {
      let option = format.querySelector<HTMLOptionElement>(`[value=${type}]`)!
      option.text = value[type]
    }
  }
})
