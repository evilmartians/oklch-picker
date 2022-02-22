import { map } from 'nanostores'

import { reportBenchmark, benchmarking } from './benchmark.js'

export interface CurrentValue {
  l: number
  c: number
  h: number
}

type PrevCurrentValue =
  | CurrentValue
  | { [key in keyof CurrentValue]?: undefined }

export let current = map<CurrentValue>({ l: 0, c: 0, h: 0 })

interface LchCallbacks {
  l?(value: number): void
  c?(value: number): void
  h?(value: number): void
  lc?(color: CurrentValue): void
  ch?(color: CurrentValue): void
  lh?(color: CurrentValue): void
}

let listeners: LchCallbacks[] = []

function runListeners(
  list: LchCallbacks[],
  value: CurrentValue,
  prev: PrevCurrentValue
): void {
  let start = Date.now()
  for (let i of list) {
    if (i.l && prev.l !== value.l) {
      i.l(value.l)
    }
    if (i.c && prev.c !== value.c) {
      i.c(value.c)
    }
    if (i.h && prev.h !== value.h) {
      i.h(value.h)
    }

    if (i.lc && (prev.l !== value.l || prev.c !== value.c)) {
      i.lc(value)
    }
    if (i.ch && (prev.c !== value.c || prev.h !== value.h)) {
      i.ch(value)
    }
    if (i.lh && (prev.l !== value.l || prev.h !== value.h)) {
      i.lh(value)
    }
  }
  reportBenchmark(Date.now() - start)
}

export function onCurrentChange(callbacks: LchCallbacks): void {
  listeners.push(callbacks)
  if (listeners.length === 1) {
    let prev: PrevCurrentValue = {}
    current.subscribe(value => {
      runListeners(listeners, value, prev)
    })
  } else {
    runListeners([callbacks], current.get(), {})
  }
}

benchmarking.listen(enabled => {
  if (enabled) {
    runListeners(listeners, current.get(), {})
  }
})
