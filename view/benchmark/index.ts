import { getLastBenchmarkColor, lastBenchmark } from '../../stores/benchmark.js'
import { benchmarking } from '../../stores/url.js'

let block = document.querySelector<HTMLDivElement>('.benchmark')!

function getValue(id: string): HTMLSpanElement {
  return block.querySelector<HTMLSpanElement>(`.benchmark_value.is-${id}`)!
}

let freezeMax = getValue('freeze-max')
let freezeSum = getValue('freeze-sum')
let workerMax = getValue('worker-max')
let workerSum = getValue('worker-sum')
let paint = getValue('paint')

let unbind: (() => void) | undefined
benchmarking.subscribe(enabled => {
  if (enabled) {
    block.classList.add('is-enabled')
    block.setAttribute('aria-hidden', 'false')
    unbind = lastBenchmark.subscribe(result => {
      block.style.setProperty('--benchmark-color', getLastBenchmarkColor())
      freezeMax.innerText = `${result.freezeMax}`
      freezeSum.innerText = `${result.freezeSum}`
      workerMax.innerText = `${result.workerMax}`
      workerSum.innerText = `${result.workerSum}`
      paint.innerText = `${result.paint}`
    })
  } else {
    block.classList.remove('is-enabled')
    block.setAttribute('aria-hidden', 'true')
    if (unbind) {
      unbind()
      unbind = undefined
    }
  }
})
