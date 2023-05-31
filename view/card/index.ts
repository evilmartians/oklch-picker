import type { SpinEvent } from '../field/index.js'

import { computeExpression, cycleByWheel, parseValue } from '../../lib/math.js'
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

type ClampAngleFn = (
  value: number,
  range: Omit<MetaSpinInput, 'step'>
) => number

function clampInRange(useWheel: boolean): ClampAngleFn {
  return (value, range) => {
    let angle = useWheel ? cycleByWheel(value, range.max) : value
    let clamped = Math.max(range.min, Math.min(range.max, angle))

    return clean(clamped)
  }
}

function initInput(type: 'l' | 'c' | 'h' | 'a'): HTMLInputElement {
  let card = document.querySelector<HTMLDivElement>(`.card.is-${type}`)!
  let text = card.querySelector<HTMLInputElement>('[role=spinbutton]')!
  let bindedClamp = clampInRange(type === 'h')

  text.addEventListener('change', () => {
    let { max, min } = getInputMeta(text)

    let computedExpression = computeExpression(text.value)
    let angleInRange = bindedClamp(computedExpression, { max, min })

    current.setKey(type, angleInRange)
    text.setAttribute('aria-valuenow', String(angleInRange))
  })

  text.addEventListener('spin', e => {
    let { max, min, step } = getInputMeta(text)

    let value = computeExpression(text.value)

    switch ((e as SpinEvent).detail.action) {
      case 'increase':
        value = value + step
        break
      case 'decrease':
        value = value - step
        break
      case 'setMaximum':
        value = max
        break
      case 'setMinimum':
        value = min
        break
    }

    let parsedValue = bindedClamp(value, { max, min })

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
