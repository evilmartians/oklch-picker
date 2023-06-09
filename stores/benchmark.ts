import { formatHex, type Oklch } from 'culori/fn'
import { map } from 'nanostores'

import { benchmarking } from './url.js'

export let lastBenchmark = map({
  freezeMax: 0,
  freezeSum: 0,
  paint: 0,
  workerMax: 0,
  workerSum: 0
})

let paintStart = 0

export function startPainting(): void {
  if (benchmarking.get()) {
    lastBenchmark.set({
      freezeMax: 0,
      freezeSum: 0,
      paint: 0,
      workerMax: 0,
      workerSum: 0
    })
    paintStart = Date.now()
  }
}

export function reportPaint(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('paint', Date.now() - paintStart)
    lastBenchmark.setKey('workerSum', lastBenchmark.get().workerSum + ms)
    if (ms > lastBenchmark.get().workerMax) {
      lastBenchmark.setKey('workerMax', ms)
    }
  }
}

export function reportFreeze(cb: () => void): void {
  if (benchmarking.get()) {
    let start = Date.now()
    cb()
    let ms = Date.now() - start

    lastBenchmark.setKey('freezeSum', lastBenchmark.get().freezeSum + ms)
    if (ms > lastBenchmark.get().freezeMax) {
      lastBenchmark.setKey('freezeMax', ms)
    }
  } else {
    cb()
  }
}

const BEST_HUE = 150
const WORST_HUE = 40
const MAX_FREEZE = 30
const MAX_PAINT = 1000

export function getLastBenchmarkColor(): string {
  let { freezeSum, paint } = lastBenchmark.get()
  let worstRate = Math.max(freezeSum / MAX_FREEZE, paint / MAX_PAINT)
  let hue = BEST_HUE - (BEST_HUE - WORST_HUE) * worstRate
  if (hue < WORST_HUE) hue = WORST_HUE
  let oklch: Oklch = { c: 0.11, h: hue, l: 0.57, mode: 'oklch' }
  return formatHex(oklch)
}
