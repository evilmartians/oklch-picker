import './index.css'
import {
  setCurrentFromColor,
  valueToColor,
  current
} from '../../stores/current.js'
import { parse, formatLch } from '../../lib/colors.js'
import { visible } from '../../stores/visible.js'

let lchInput = document.querySelector<HTMLInputElement>('#text-lch')!
let lchError = document.querySelector<HTMLDivElement>('#text-lch-error')!
let rgbInput = document.querySelector<HTMLInputElement>('#text-rgb')!
let rgbError = document.querySelector<HTMLDivElement>('#text-rgb-error')!

function toggle(
  input: HTMLInputElement,
  error: HTMLDivElement,
  invalid: boolean
): void {
  if (invalid) {
    input.setAttribute('aria-invalid', 'true')
    input.setAttribute('aria-errormessage', error.id)
  } else {
    input.removeAttribute('aria-invalid')
    input.removeAttribute('aria-errormessage')
  }
  error.ariaHidden = invalid ? 'false' : 'true'
  error.classList.toggle('is-show', invalid)
}

current.subscribe(value => {
  lchInput.value = formatLch(valueToColor(value))
  toggle(lchInput, lchError, false)
})

visible.subscribe(({ real, fallback }) => {
  rgbInput.value = real || fallback
  toggle(rgbInput, rgbError, false)
})

function listenChanges(input: HTMLInputElement, error: HTMLDivElement): void {
  let prevValue = input.value.trim()

  function processChange(): void {
    let newValue = input.value.trim()

    if (newValue === prevValue) return
    prevValue = newValue

    let parsed = parse(newValue)
    if (parsed) {
      setCurrentFromColor(parsed)
      toggle(input, error, false)
    } else {
      toggle(input, error, true)
    }
  }

  input.addEventListener('change', processChange)
  input.addEventListener('keyup', processChange)
}

listenChanges(lchInput, lchError)
listenChanges(rgbInput, rgbError)
