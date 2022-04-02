import { atom, map } from 'nanostores'

export let benchmarking = atom(false)

export let lastBenchmark = map({ freeze: 0, paint: 0 })

let bound = false
export function bindFreezeToPaint(): void {
  bound = true
}

export function reportFreeze(ms: number): void {
  if (benchmarking.get()) {
    if (bound) {
      lastBenchmark.set({ freeze: ms, paint: ms })
    } else {
      lastBenchmark.setKey('freeze', ms)
    }
  }
}

export function reportPaint(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.setKey('paint', ms)
  }
}

function keyUp(e: KeyboardEvent): void {
  if (e.key === 'b' && e.target === document.body) {
    benchmarking.set(!benchmarking.get())
  }
}
document.body.addEventListener('keyup', keyUp)
