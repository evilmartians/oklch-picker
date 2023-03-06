import { Oklch, formatHex } from 'culori/fn'
import { atom, map } from 'nanostores'

export type RenderType = 'l' | 'c' | 'h'

export let benchmarking = atom(false)

if (/^\?bench(=|&|$)/.test(location.search)) {
  benchmarking.set(true)
}
benchmarking.listen(value => {
  history.pushState(
    null,
    '',
    location.pathname + (value ? '?bench' : '') + location.hash
  )
})

function keyUp(e: KeyboardEvent): void {
  if (e.key === 'b' && e.target === document.body) {
    benchmarking.set(!benchmarking.get())
  }
}
document.body.addEventListener('keyup', keyUp)

export let lastBenchmark = map({ rlFreeze: 0, pidFreeze: 0, full: 0 })

let collectingTimeout: number
let collecting = false
let totalFull = -1

function startCollecting(): void {
  if (!collecting) {
    collecting = true
    collectingTimeout = setTimeout(() => {
      if (totalFull >= 0) lastBenchmark.setKey('full', totalFull)
      resetCollecting()
    }, 100)
  }
}

export function resetCollecting(): void {
  if (collecting) {
    collecting = false
    clearTimeout(collectingTimeout)
    totalFull = -1
  }
}

export function reportRunListenersFreeze(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('rlFreeze', ms)
  }
}

export function reportPutImageDataFreeze(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('pidFreeze', ms)
  }
}

export function reportFull(ms: number): void {
  if (benchmarking.get()) {
    startCollecting()
    totalFull += ms
  }
}

const BEST_HUE = 150
const WORST_HUE = 40
const MAX_TIME = 300

export function getLastBenchmarkColor(): string {
  let { rlFreeze, pidFreeze } = lastBenchmark.get()
  let hue = BEST_HUE - ((BEST_HUE - WORST_HUE) * (rlFreeze + pidFreeze)) / MAX_TIME
  if (hue < WORST_HUE) hue = WORST_HUE
  let oklch: Oklch = { mode: 'oklch', l: 0.57, c: 0.11, h: hue }
  return formatHex(oklch)
}
