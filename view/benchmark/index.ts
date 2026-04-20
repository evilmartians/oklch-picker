import { waitForWorkersIdle } from '../../lib/workers.ts'
import {
  clearBenchmarkHistory,
  computeBenchmarkStats,
  flushCurrentFrame,
  type FrameRecord,
  getBenchmarkHistory,
  getLastBenchmarkColor,
  lastBenchmark
} from '../../stores/benchmark.ts'
import { setCurrentComponents } from '../../stores/current.ts'
import { benchmarking } from '../../stores/url.ts'

let block = document.querySelector<HTMLDivElement>('.benchmark')!

function getValue(id: string): HTMLElement {
  return block.querySelector<HTMLElement>(`.is-${id}`)!
}

let freezeMax = getValue('freeze-max')
let freezeSum = getValue('freeze-sum')
let workerMax = getValue('worker-max')
let workerSum = getValue('worker-sum')
let paint = getValue('paint')

let runBtn = block.querySelector<HTMLButtonElement>('.benchmark_run')!
let status = block.querySelector<HTMLSpanElement>('.benchmark_status')!

const BATCH_N = 500
const WARMUP_N = 10

let statCells = (
  [
    ['paint', 'paint'],
    ['wmax', 'workerMax'],
    ['wsum', 'workerSum'],
    ['fsum', 'freezeSum']
  ] as [string, keyof FrameRecord][]
).map(([id, key]) => ({
  key,
  median: getValue(`stat-${id}-median`),
  p95: getValue(`stat-${id}-p95`)
}))

function fmt(n: number): string {
  return n.toFixed(1)
}

function resetStats(): void {
  for (let c of statCells) {
    c.median.innerText = '—'
    c.p95.innerText = '—'
  }
}

function renderStats(history: readonly FrameRecord[]): void {
  if (history.length === 0) {
    resetStats()
    return
  }
  for (let c of statCells) {
    let s = computeBenchmarkStats(history.map(r => r[c.key]))
    c.median.innerText = fmt(s.median)
    c.p95.innerText = fmt(s.p95)
  }
}

async function driveFrame(t: number): Promise<void> {
  setCurrentComponents({
    c: 0.05 + 0.2 * ((t * 7) % 1),
    h: (t * 360 * 3) % 360,
    l: 0.2 + 0.6 * t
  })
  await waitForWorkersIdle()
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      resolve(null)
    })
  })
}

async function runBatch(): Promise<void> {
  runBtn.disabled = true
  clearBenchmarkHistory()
  resetStats()

  for (let i = 0; i < BATCH_N; i++) {
    status.innerText = `${i + 1} / ${BATCH_N}`
    await driveFrame((i + 1) / BATCH_N)
    if (i + 1 === WARMUP_N) clearBenchmarkHistory()
  }

  flushCurrentFrame()
  renderStats(getBenchmarkHistory())
  status.innerText = `done (${getBenchmarkHistory().length})`
  runBtn.disabled = false
}

runBtn.addEventListener('click', () => {
  void runBatch()
})

let unbind: (() => void) | undefined
benchmarking.subscribe(enabled => {
  if (enabled) {
    block.classList.add('is-enabled')
    block.setAttribute('aria-hidden', 'false')
    unbind = lastBenchmark.subscribe(result => {
      block.style.setProperty('--benchmark-color', getLastBenchmarkColor())
      freezeMax.innerText = fmt(result.freezeMax)
      freezeSum.innerText = fmt(result.freezeSum)
      workerMax.innerText = fmt(result.workerMax)
      workerSum.innerText = fmt(result.workerSum)
      paint.innerText = fmt(result.paint)
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
