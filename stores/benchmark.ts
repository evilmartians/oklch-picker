import { Oklch, formatHex } from 'culori/fn'
import { map } from 'nanostores'

import { benchmarking } from './url.js'

export let lastBenchmark = map({
  freezeMax: 0,
  freezeSum: 0,
  workerMax: 0,
  workerSum: 0,
  paint: 0
})

let paintStart = 0

export function startPainting(): void {
  if (benchmarking.get()) {
    lastBenchmark.set({
      freezeMax: 0,
      freezeSum: 0,
      workerMax: 0,
      workerSum: 0,
      paint: 0
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
const MAX_TIME = 300

export function getLastBenchmarkColor(): string {
  let { freezeSum } = lastBenchmark.get()
  let hue = BEST_HUE - ((BEST_HUE - WORST_HUE) * freezeSum) / MAX_TIME
  if (hue < WORST_HUE) hue = WORST_HUE
  let oklch: Oklch = { mode: 'oklch', l: 0.57, c: 0.11, h: hue }
  return formatHex(oklch)
}
