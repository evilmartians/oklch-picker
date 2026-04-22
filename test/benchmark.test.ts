import './set-globals.ts'

import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import '../lib/colors.ts'
import {
  clearBenchmarkHistory,
  computeBenchmarkStats,
  getLastBenchmarkColor,
  lastBenchmark
} from '../stores/benchmark.ts'

function frame(freezeSum: number, paint: number): {
  freezeMax: number
  freezeSum: number
  paint: number
  workerMax: number
  workerSum: number
} {
  return {
    freezeMax: freezeSum,
    freezeSum,
    paint,
    workerMax: 0,
    workerSum: 0
  }
}

test('getLastBenchmarkColor maps perf to hue', () => {
  lastBenchmark.set(frame(0, 0))
  deepStrictEqual(getLastBenchmarkColor(), '#418954')

  lastBenchmark.set(frame(1, 50))
  deepStrictEqual(getLastBenchmarkColor(), '#4b884c')

  lastBenchmark.set(frame(15, 500))
  deepStrictEqual(getLastBenchmarkColor(), '#8c7616')

  lastBenchmark.set(frame(40, 1200))
  deepStrictEqual(getLastBenchmarkColor(), '#ad5f43')

  clearBenchmarkHistory()
})

test('computeBenchmarkStats: empty → zeros', () => {
  deepStrictEqual(computeBenchmarkStats([]), { median: 0, p95: 0 })
})

test('computeBenchmarkStats: single value', () => {
  deepStrictEqual(computeBenchmarkStats([5]), { median: 5, p95: 5 })
})

test('computeBenchmarkStats: sorted input', () => {
  deepStrictEqual(
    computeBenchmarkStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
    { median: 6, p95: 10 }
  )
})

test('computeBenchmarkStats: unsorted input', () => {
  deepStrictEqual(
    computeBenchmarkStats([10, 1, 5, 2, 8, 3, 9, 4, 7, 6]),
    { median: 6, p95: 10 }
  )
})
