import { atom, onMount } from 'nanostores'

export let benchmarking = atom(false)

onMount(benchmarking, () => {
  function keyUp(e: KeyboardEvent): void {
    if (e.key === 'b' && e.target === document.body) {
      benchmarking.set(!benchmarking.get())
    }
  }
  document.body.addEventListener('keyup', keyUp)
  return () => {
    document.body.removeEventListener('keyup', keyUp)
  }
})

export let lastBenchmark = atom(0)

export function reportBenchmark(ms: number): void {
  if (benchmarking.get()) {
    lastBenchmark.set(ms)
  }
}
