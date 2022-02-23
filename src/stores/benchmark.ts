import { atom } from 'nanostores'

export let benchmarking = atom(false)

export let lastBenchmark = atom(0)

export function reportBenchmark(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.set(ms)
  }
}

function keyUp(e: KeyboardEvent): void {
  if (e.key === 'b' && e.target === document.body) {
    benchmarking.set(!benchmarking.get())
  }
}
document.body.addEventListener('keyup', keyUp)
