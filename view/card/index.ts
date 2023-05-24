import { current, onCurrentChange } from '../../stores/current.js'
import { showRec2020, showCharts } from '../../stores/settings.js'

function initInput(type: 'l' | 'c' | 'h' | 'a'): HTMLInputElement {
  let card = document.querySelector<HTMLDivElement>(`.card.is-${type}`)!
  let text = card.querySelector<HTMLInputElement>('[role=spinbutton]')!

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

showCharts.subscribe(show => {
  document.body.classList.toggle('is-chart-hidden', !show)
})

showRec2020.subscribe(show => {
  textC.max = String(show ? C_MAX_REC2020 : C_MAX)
})
