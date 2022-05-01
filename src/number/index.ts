import './index.css'

import { current, onCurrentChange } from '../stores/current.js'

function initInputs(
  type: 'l' | 'c' | 'h' | 'alpha'
): [HTMLInputElement, HTMLInputElement] {
  let div = document.querySelector<HTMLInputElement>(`.number.is-${type}`)!
  let range = div.querySelector<HTMLInputElement>('[type=range]')!
  let text = div.querySelector<HTMLInputElement>('[type=number]')!

  text.addEventListener('change', () => {
    current.setKey(type, parseFloat(text.value))
    range.value = text.value
  })

  range.addEventListener('change', () => {
    current.setKey(type, parseFloat(range.value))
    text.value = range.value
  })

  return [range, text]
}

let [rangeL, textL] = initInputs('l')
let [rangeC, textC] = initInputs('c')
let [rangeH, textH] = initInputs('h')
let [rangeAlpha, textAlpha] = initInputs('alpha')

onCurrentChange({
  l(value) {
    rangeL.value = textL.value = String(value)
  },
  c(value) {
    rangeC.value = textC.value = String(value)
  },
  h(value) {
    rangeH.value = textH.value = String(value)
  },
  alpha(value) {
    rangeAlpha.value = textAlpha.value = String(value)
  }
})
