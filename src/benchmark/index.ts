import './index.css'
import { benchmarking, lastBenchmark } from '../stores/benchmark.js'

let block = document.querySelector<HTMLDivElement>('.benchmark')!
let freeze = document.querySelector<HTMLSpanElement>('#benchmark-freeze')!
let paint = document.querySelector<HTMLSpanElement>('#benchmark-paint')!

let unbind: undefined | (() => void)
benchmarking.subscribe(enabled => {
  if (enabled) {
    block.classList.add('is-enabled')
    block.setAttribute('aria-hidden', 'false')
    unbind = lastBenchmark.subscribe(result => {
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
