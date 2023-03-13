import { Oklch, formatHex } from 'culori/fn'
import { map } from 'nanostores'

import { benchmarking } from './url.js'

export type RenderType = 'l' | 'c' | 'h'

export let lastBenchmark = map({ freezeSum: 0, freezeMax: 0, frame: 0, full: 0 })

let collectingTimeout: number
let collecting = false
let start = 0

export function reportFrame(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('frame', ms)
  }
}

export function setStart(ms: number): void {
  if (benchmarking.get()) {
    start = ms
  }
}

export function reportFreeze(ms: number): void {
  if (benchmarking.get()) {
    if (ms > lastBenchmark.get().freezeMax) lastBenchmark.setKey('freezeMax', ms)
    lastBenchmark.setKey('freezeSum', lastBenchmark.get().freezeSum + ms)
  }
}

export function resetFreeze(): void {
  lastBenchmark.get().freezeMax = 0
  lastBenchmark.get().freezeSum = 0
}

export function reportFull(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('full', ms - start)
  }
}

const BEST_HUE = 150
const WORST_HUE = 40
const MAX_TIME = 300

export function getLastBenchmarkColor(): string {
  let hue = BEST_HUE - ((BEST_HUE - WORST_HUE) * lastBenchmark.get().freezeSum) / MAX_TIME
  if (hue < WORST_HUE) hue = WORST_HUE
  let oklch: Oklch = { mode: 'oklch', l: 0.57, c: 0.11, h: hue }
  return formatHex(oklch)
}
