import type { SpinEvent } from '../field/index.js'

import { computeExpression, parseValue } from '../../lib/math.js'
import { current, onCurrentChange } from '../../stores/current.js'
import { showRec2020, showCharts } from '../../stores/settings.js'
import { clean } from '../../lib/colors.js'

interface MetaSpinInput {
  max: number
  min: number
  step: number
}

function getInputMeta(input: HTMLInputElement): MetaSpinInput {
  return {
    step: parseValue(input.getAttribute('step')!),
    max: parseValue(input.getAttribute('aria-valuemax')!),
    min: parseValue(input.getAttribute('aria-valuemin')!)
  }
}

function initInput(type: 'l' | 'c' | 'h' | 'a'): HTMLInputElement {
  let card = document.querySelector<HTMLDivElement>(`.card.is-${type}`)!
  let text = card.querySelector<HTMLInputElement>('[role=spinbutton]')!

  text.addEventListener('change', () => {
    let { max, min } = getInputMeta(text)

    let computedExpression = clean(
      Math.max(min, Math.min(max, computeExpression(text.value)))
    )

    current.setKey(type, computedExpression)
    text.setAttribute('aria-valuenow', String(computedExpression))
  })

  text.addEventListener('spin', e => {
    let { max, min, step } = getInputMeta(text)

    let value = computeExpression(text.value)

    switch ((e as SpinEvent).detail.action) {
      case 'increase':
        value = Math.min(max, value + step)
        break
      case 'decrease':
        value = Math.max(min, value - step)
        break
      case 'setMaximum':
        value = max
        break
      case 'setMinimum':
        value = min
        break
    }

    let parsedValue = clean(value)
    current.setKey(type, parsedValue)
    text.setAttribute('aria-valuenow', String(parsedValue))
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
  textC.setAttribute('aria-valuemax', String(show ? C_MAX_REC2020 : C_MAX))
})
