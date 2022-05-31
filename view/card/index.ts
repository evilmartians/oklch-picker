import { current, onCurrentChange } from '../../stores/current.js'
import { settings } from '../../stores/settings.js'

function initInput(type: 'l' | 'c' | 'h' | 'a'): HTMLInputElement {
  let card = document.querySelector<HTMLDivElement>(`.card.is-${type}`)!
  let text = card.querySelector<HTMLInputElement>('[type=number]')!

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

settings.subscribe(({ charts, rec2020 }) => {
  document.body.classList.toggle('is-chart-hidden', !charts)
  textC.max = String(rec2020 ? C_MAX_REC2020 : C_MAX)
})
