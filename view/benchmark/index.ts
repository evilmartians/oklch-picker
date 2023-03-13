import { getLastBenchmarkColor, lastBenchmark } from '../../stores/benchmark.js'
import { benchmarking } from '../../stores/url.js'

let block = document.querySelector<HTMLDivElement>('.benchmark')!
let freezeSum = block.querySelector<HTMLSpanElement>('.benchmark_freeze-sum')!
let freezeMax = block.querySelector<HTMLSpanElement>('.benchmark_freeze-max')!
let frame = block.querySelector<HTMLSpanElement>('.benchmark_paint')!
let full = block.querySelector<HTMLSpanElement>('.benchmark_workers-sum')!

let unbind: undefined | (() => void)
benchmarking.subscribe(enabled => {
  if (enabled) {
    block.classList.add('is-enabled')
    block.setAttribute('aria-hidden', 'false')
    unbind = lastBenchmark.subscribe(result => {
      block.style.setProperty('--benchmark-color', getLastBenchmarkColor())
      freezeSum.innerText =`${result.freezeSum}`
      freezeMax.innerText =`${result.freezeMax}`
      frame.innerText =`${result.paint}`
      full.innerText = `${result.workersSum}`
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
