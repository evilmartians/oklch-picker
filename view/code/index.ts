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

let prevValues = new Map<HTMLInputElement, string>()

current.subscribe(value => {
  let text = formatLch(valueToColor(value))
  prevValues.set(lchInput, text)
  lchInput.value = text
  toggle(lchInput, false)
})

visible.subscribe(({ fallback, space }) => {
  prevValues.set(rgbInput, fallback)
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
  function processChange(): void {
    let newValue = input.value.trim()

    if (newValue === prevValues.get(input)) return
    prevValues.set(input, newValue)
    console.log('convert')

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
