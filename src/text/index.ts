import './index.css'
import { current, setCurrentRound } from '../stores/current.js'
import { parse, oklch, formatLch } from '../../lib/colors.js'
import { visible } from '../stores/visible.js'

let lchInput = document.querySelector<HTMLInputElement>('#text-lch')!
let lchError = document.querySelector<HTMLDivElement>('#text-lch-error')!
let rgbInput = document.querySelector<HTMLInputElement>('#text-rgb')!
let rgbError = document.querySelector<HTMLDivElement>('#text-rgb-error')!

// TODO aria connection with <input>
function toggle(div: HTMLDivElement, show: boolean): void {
  div.ariaHidden = show ? 'false' : 'true'
  div.classList.toggle('is-show', show)
}

current.subscribe(color => {
  lchInput.value = formatLch({ mode: 'lch', ...color })
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
      setCurrentRound(oklch(parsed))
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
