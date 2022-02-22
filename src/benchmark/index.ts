import './index.css'
import { benchmarking, lastBenchmark } from '../stores/benchmark.js'

let result = document.querySelector<HTMLDivElement>('.benchmark')!

let unbind: undefined | (() => void)
benchmarking.subscribe(enabled => {
  if (enabled) {
    result.classList.add('is-enabled')
    result.setAttribute('aria-hidden', 'false')
    unbind = lastBenchmark.subscribe(value => {
      result.innerText = `${value}`
    })
  } else {
    result.classList.remove('is-enabled')
    result.setAttribute('aria-hidden', 'true')
    if (unbind) {
      unbind()
      unbind = undefined
    }
  }
})
