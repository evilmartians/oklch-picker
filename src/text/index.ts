import './index.css'
import { parse, oklch } from '../../lib/colors.js'
import { current } from '../stores/current.js'
import { visible } from '../stores/visible.js'

let lchInput = document.querySelector<HTMLInputElement>('#text-lch')!
let lchError = document.querySelector<HTMLDivElement>('#text-lch-error')!
let rgbInput = document.querySelector<HTMLInputElement>('#text-rgb')!
let rgbError = document.querySelector<HTMLDivElement>('#text-rgb-error')!
// TODO 2-way convert

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

// TODO aria connection with <input>
function toggle(div: HTMLDivElement, show: boolean): void {
  div.ariaHidden = show ? 'false' : 'true'
  div.classList.toggle('is-show', show)
}

current.subscribe(({ l, c, h, alpha }) => {
  let postfix = alpha < 1 ? ` / ${round(100 * alpha)}%` : ''
  lchInput.value = `oklch(${round(100 * l)}% ${round(c)} ${round(h)}${postfix})`
  toggle(lchError, false)
})

visible.subscribe(({ rgb }) => {
  rgbInput.value = rgb
  toggle(rgbError, false)
})

function listenChanges(input: HTMLInputElement, error: HTMLDivElement): void {
  let prevValue = input.value.trim()

  function processChange(): void {
    let newValue = input.value.trim()

    if (newValue === prevValue) return
    prevValue = newValue

    let parsed = parse(newValue)
    if (parsed) {
      let { l, c, h, alpha } = oklch(parsed)
      current.set({ l, c, h, alpha: alpha ?? 1 })
      toggle(error, false)
    } else {
      toggle(error, true)
    }
  }

  input.addEventListener('change', processChange)
  input.addEventListener('keyup', processChange)
}

listenChanges(lchInput, lchError)
listenChanges(rgbInput, rgbError)
