import { colordx } from '@colordx/core'
import { map } from 'nanostores'

import { benchmarking } from './url.ts'

export interface FrameRecord {
  freezeMax: number
  freezeSum: number
  paint: number
  workerMax: number
  workerSum: number
}

function emptyFrame(): FrameRecord {
  return {
    freezeMax: 0,
    freezeSum: 0,
    paint: 0,
    workerMax: 0,
    workerSum: 0
  }
}

export let lastBenchmark = map(emptyFrame())

const HISTORY_MAX = 1000

let history: FrameRecord[] = []
let current: FrameRecord = emptyFrame()
let paintStart = 0
let hasPending = false

export function flushCurrentFrame(): void {
  if (!hasPending) return
  history.push({ ...current })
  if (history.length > HISTORY_MAX) history.shift()
  current = emptyFrame()
  hasPending = false
}

export function startPainting(): void {
  if (!benchmarking.get()) return
  flushCurrentFrame()
  paintStart = performance.now()
  lastBenchmark.set(emptyFrame())
}

export function reportPaint(ms: number): void {
  if (!benchmarking.get()) return
  hasPending = true
  current.paint = performance.now() - paintStart
  current.workerSum += ms
  if (ms > current.workerMax) current.workerMax = ms
  lastBenchmark.set({ ...current })
}

export function reportFreeze(cb: () => void): void {
  if (!benchmarking.get()) {
    cb()
    return
  }
  let start = performance.now()
  cb()
  let ms = performance.now() - start

  hasPending = true
  current.freezeSum += ms
  if (ms > current.freezeMax) current.freezeMax = ms
  lastBenchmark.set({ ...current })
}

export function clearBenchmarkHistory(): void {
  history = []
  current = emptyFrame()
  hasPending = false
  lastBenchmark.set(emptyFrame())
}

export function getBenchmarkHistory(): readonly FrameRecord[] {
  return history
}

export function computeBenchmarkStats(values: number[]): {
  median: number
  p95: number
} {
  if (values.length === 0) return { median: 0, p95: 0 }
  let sorted = values.toSorted((a, b) => a - b)
  let mid = Math.floor(sorted.length * 0.5)
  let p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
  return { median: sorted[mid], p95: sorted[p95Idx] }
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
  return colordx({ c: 0.11, h: hue, l: 0.57 }).toHex()
}
