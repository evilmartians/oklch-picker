import { Oklch, formatHex } from 'culori/fn'
import { map } from 'nanostores'

import { benchmarking } from './url.js'

export type RenderType = 'l' | 'c' | 'h'

export let lastBenchmark = map({
  freezeSum: 0,
  freezeMax: 0,
  paint: 0,
  workersSum: 0
})

let start = 0

export function reportFrame(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('paint', ms)
  }
}

export function setFrameStart(time: number): void {
  if (benchmarking.get()) {
    start = time
  }
}

export function reportFreeze(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('freezeSum', lastBenchmark.get().freezeSum + ms)
    if (ms > lastBenchmark.get().freezeMax) {
      lastBenchmark.setKey('freezeMax', ms)
    }
  }
}

export function resetFreeze(): void {
  lastBenchmark.setKey('freezeMax', 0)
  lastBenchmark.setKey('freezeSum', 0)
}

export function reportFull(time: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('workersSum', time - start)
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
