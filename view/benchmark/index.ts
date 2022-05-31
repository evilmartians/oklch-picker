import {
  getLastBenchmarkColor,
  lastBenchmark,
  benchmarking
} from '../../stores/benchmark.js'

let block = document.querySelector<HTMLDivElement>('.benchmark')!
let freeze = block.querySelector<HTMLSpanElement>('.benchmark_freeze')!
let paint = block.querySelector<HTMLSpanElement>('.benchmark_paint')!

let unbind: undefined | (() => void)
benchmarking.subscribe(enabled => {
  if (enabled) {
    block.classList.add('is-enabled')
    block.setAttribute('aria-hidden', 'false')
    unbind = lastBenchmark.subscribe(result => {
      block.style.setProperty('--benchmark-color', getLastBenchmarkColor())
      freeze.innerText = `${result.freeze}`
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
