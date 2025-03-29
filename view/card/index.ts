import { clean } from '../../lib/colors.ts'
import { computeExpression, cycleByWheel, parseValue } from '../../lib/math.ts'
import { current, onCurrentChange } from '../../stores/current.ts'
import { showCharts, showRec2020 } from '../../stores/settings.ts'
import type { SpinEvent } from '../field/index.ts'

interface MetaSpinInput {
  max: number
  min: number
  step: number
}

function getInputMeta(input: HTMLInputElement): MetaSpinInput {
  return {
    max: parseValue(input.getAttribute('aria-valuemax')!),
    min: parseValue(input.getAttribute('aria-valuemin')!),
    step: parseValue(input.getAttribute('step')!)
  }
}

type ClampAngleFn = (
  value: number,
  range: Omit<MetaSpinInput, 'step'>
) => number

function clampInRange(useWheel: boolean, precision: number): ClampAngleFn {
  return (value, range) => {
    let angle = useWheel ? cycleByWheel(value, range.max) : value
    let clamped = Math.max(range.min, Math.min(range.max, angle))

    return clean(clamped, precision)
  }
}

function initInput(type: 'a' | 'c' | 'h' | 'l'): HTMLInputElement {
  let card = document.querySelector<HTMLDivElement>(`.card.is-${type}`)!
  let text = card.querySelector<HTMLInputElement>('[role=spinbutton]')!
  let bindedClamp = clampInRange(type === 'h', type === 'h' ? 2 : 4)

  text.addEventListener('change', () => {
    let { max, min } = getInputMeta(text)

    let computedExpression = computeExpression(text.value)
    let angleInRange = bindedClamp(computedExpression, { max, min })

    current.setKey(type, angleInRange)
    text.setAttribute('aria-valuenow', String(angleInRange))
  })

  text.addEventListener('spin', (e: SpinEvent) => {
    let { max, min, step } = getInputMeta(text)

    let value = computeExpression(text.value)
    if (e.detail?.action === 'increase') {
      value = value + step * e.detail.speed
    } else if (e.detail?.action === 'decrease') {
      value = value - step * e.detail.speed
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
  alpha(value) {
    textA.value = String(value)
  },
  c(value) {
    textC.value = String(value)
  },
  h(value) {
    textH.value = String(value)
  },
  l(value) {
    textL.value = String(value)
  }
})

showCharts.subscribe(show => {
  document.body.classList.toggle('is-chart-hidden', !show)
})

showRec2020.subscribe(show => {
  textC.setAttribute('aria-valuemax', String(show ? C_MAX_REC2020 : C_MAX))
})
