import './index.css'

import {
  setCurrentFromColor,
  valueToColor,
  current
} from '../../stores/current.js'
import { parse, formatLch } from '../../lib/colors.js'
import { visible } from '../../stores/visible.js'

let lch = document.querySelector<HTMLDivElement>('.code.is-lch')!
let lchInput = lch.querySelector<HTMLInputElement>('input')!

let rgb = document.querySelector<HTMLDivElement>('.code.is-rgb')!
let rgbInput = rgb.querySelector<HTMLInputElement>('input')!

let notePaste = document.querySelector<HTMLDivElement>('.code_note.is-paste')!
let noteFallback = document.querySelector<HTMLDivElement>(
  '.code_note.is-fallback'
)!

function toggle(input: HTMLInputElement, invalid: boolean): void {
  if (invalid) {
    input.setAttribute('aria-invalid', 'true')
  } else {
    input.removeAttribute('aria-invalid')
  }
}

current.subscribe(value => {
  lchInput.value = formatLch(valueToColor(value))
  toggle(lchInput, false)
})

visible.subscribe(({ fallback, space }) => {
  rgbInput.value = fallback
  if (space === 'srgb') {
    notePaste.classList.remove('is-hidden')
    noteFallback.classList.add('is-hidden')
  } else {
    notePaste.classList.add('is-hidden')
    noteFallback.classList.remove('is-hidden')
  }
  toggle(rgbInput, false)
})

function listenChanges(input: HTMLInputElement): void {
  let prevValue = input.value.trim()

  function processChange(): void {
    let newValue = input.value.trim()

    if (newValue === prevValue) return
    prevValue = newValue

    let parsed = parse(newValue)
    if (parsed) {
      setCurrentFromColor(parsed)
      toggle(input, false)
    } else {
      toggle(input, true)
    }
  }

  input.addEventListener('change', processChange)
  input.addEventListener('keyup', processChange)
}

listenChanges(lchInput)
listenChanges(rgbInput)
