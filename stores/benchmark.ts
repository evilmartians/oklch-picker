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

export let lastBenchmark = map({ freeze: 0, quick: 0, full: 0 })

let collectingTimeout: number
let collecting = false
let totalQuick = -1
let totalFull = -1

function startCollecting(): void {
  if (!collecting) {
    collecting = true
    collectingTimeout = setTimeout(() => {
      if (totalQuick >= 0) lastBenchmark.setKey('quick', totalQuick)
      if (totalFull >= 0) lastBenchmark.setKey('full', totalFull)
      resetCollecting()
    }, 100)
  }
}

export function resetCollecting(): void {
  if (collecting) {
    collecting = false
    clearTimeout(collectingTimeout)
    totalQuick = -1
    totalFull = -1
  }
}

export function reportFreeze(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('freeze', ms)
  }
}

let quick = {
  l: {
    count: 0,
    total: 0,
    prevScale: 1
  },
  c: {
    count: 0,
    total: 0,
    prevScale: 1
  },
  h: {
    count: 0,
    total: 0,
    prevScale: 1
  }
}

const DESIRE_RENDER_TIME = 16
const DEFAULT_SCALE = 2

export function reportQuick(type: RenderType, ms: number): void {
  quick[type].count += 1
  quick[type].total += ms

  if (benchmarking.get()) {
    startCollecting()
    totalQuick += ms
  }
}

export function getQuickScale(type: RenderType, isFull: boolean): number {
  if (isFull) return 1
  if (quick[type].count === 0) {
    return DEFAULT_SCALE
  }

  let time = quick[type].total / quick[type].count
  let scale = Math.ceil((quick[type].prevScale * time) / DESIRE_RENDER_TIME)
  quick[type].prevScale = scale
  return scale
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

export function trackPaint(
  type: RenderType,
  isFull: boolean,
  cb: () => void
): void {
  let start = Date.now()
  cb()
  let ms = Date.now() - start
  reportFreeze(ms)
  if (isFull) {
    reportFull(ms)
  } else {
    reportQuick(type, ms)
  }
}
