import './index.css'

import { current, onCurrentChange } from '../../stores/current.js'

function initInput(type: 'l' | 'c' | 'h' | 'a'): HTMLInputElement {
  let div = document.querySelector<HTMLInputElement>(`.number.is-${type}`)!
  let text = div.querySelector<HTMLInputElement>('[type=number]')!

  text.addEventListener('change', () => {
    current.setKey(type, parseFloat(text.value))
  })

  return text
}

let textL = initInput('l')
let textC = initInput('c')
let textH = initInput('h')
let textA = initInput('a')

onCurrentChange({
  l(value) {
    textL.value = String(value)
  },
  c(value) {
    textC.value = String(value)
  },
  h(value) {
    textH.value = String(value)
  },
  alpha(value) {
    textA.value = String(value)
  }
})
