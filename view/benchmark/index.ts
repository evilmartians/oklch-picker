import { getLastBenchmarkColor, lastBenchmark } from '../../stores/benchmark.js'
import { benchmarking } from '../../stores/url.js'

let block = document.querySelector<HTMLDivElement>('.benchmark')!
let freezeSum = block.querySelector<HTMLSpanElement>('.benchmark_freeze_sum')!
let freezeMax = block.querySelector<HTMLSpanElement>('.benchmark_freeze_max')!
let frame = block.querySelector<HTMLSpanElement>('.benchmark_frame')!
let full = block.querySelector<HTMLSpanElement>('.benchmark_full')!

let unbind: undefined | (() => void)
benchmarking.subscribe(enabled => {
  if (enabled) {
    block.classList.add('is-enabled')
    block.setAttribute('aria-hidden', 'false')
    unbind = lastBenchmark.subscribe(result => {
      block.style.setProperty('--benchmark-color', getLastBenchmarkColor())
      freezeSum.innerText =`${result.freezeSum}`
      freezeMax.innerText =`${result.freezeMax}`
      frame.innerText =`${result.frame}`
      full.innerText = `${result.full}`
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
