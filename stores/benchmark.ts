import { Oklch, formatHex } from 'culori/fn'
import { atom, map } from 'nanostores'

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

export let lastBenchmark = map({ freeze: 0, quick: 0, full: 0 })

let collectingTimeout: number
let collecting = false
let totalFreeze = 0
let totalQuick = 0
let totalFull = 0

function startCollecting(): void {
  if (!collecting) {
    collecting = true
    collectingTimeout = setTimeout(() => {
      lastBenchmark.set({
        freeze: totalFreeze,
        quick: totalQuick,
        full: totalFull
      })
      resetCollecting()
    }, 100)
  }
}

export function resetCollecting(): void {
  if (collecting) {
    collecting = false
    clearTimeout(collectingTimeout)
    totalFreeze = 0
    totalQuick = 0
    totalFull = 0
  }
}

export function reportFreeze(ms: number): void {
  if (benchmarking.get()) {
    startCollecting()
    totalFreeze += ms
  }
}

export function reportQuick(ms: number): void {
  if (benchmarking.get()) {
    startCollecting()
    totalQuick += ms
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
  let { freeze } = lastBenchmark.get()
  let hue = BEST_HUE - ((BEST_HUE - WORST_HUE) * freeze) / MAX_TIME
  if (hue < WORST_HUE) hue = WORST_HUE
  let oklch: Oklch = { mode: 'oklch', l: 0.57, c: 0.11, h: hue }
  return formatHex(oklch)
}

export function trackPaint(isFull: boolean, cb: () => void): void {
  let start = Date.now()
  cb()
  let ms = Date.now() - start
  reportFreeze(ms)
  if (isFull) {
    reportFull(ms)
  } else {
    reportQuick(ms)
  }
}
