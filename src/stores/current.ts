import { map, onSet } from 'nanostores'

import { reportBenchmark, benchmarking } from './benchmark.js'

export interface LchColor {
  l: number
  c: number
  h: number
  alpha: number
}

type PrevCurrentValue = LchColor | { [key in keyof LchColor]?: undefined }

function randomColor(): LchColor {
  return { l: 0.7, c: 0.1, h: Math.round(360 * Math.random()), alpha: 1 }
}

function parseHash(): LchColor | undefined {
  let parts = location.hash.slice(1).split(',')
  if (parts.length === 4) {
    if (parts.every(i => /^\d+(\.\d+)?$/.test(i))) {
      return {
        l: parseFloat(parts[0]),
        c: parseFloat(parts[1]),
        h: parseFloat(parts[2]),
        alpha: parseFloat(parts[3])
      }
    }
  }
  return undefined
}

export let current = map<LchColor>(parseHash() || randomColor())

onSet(current, ({ newValue }) => {
  let { l, c, h, alpha } = newValue
  let hash = `#${l},${c},${h},${alpha}`
  if (location.hash !== hash) {
    history.pushState(null, '', `#${l},${c},${h},${alpha}`)
  }
})

window.addEventListener('hashchange', () => {
  let color = parseHash()
  if (color) current.set(color)
})

interface LchCallbacks {
  l?(value: number): void
  c?(value: number): void
  h?(value: number): void
  alpha?(value: number): void
  lc?(color: LchColor): void
  ch?(color: LchColor): void
  lh?(color: LchColor): void
  lch?(color: LchColor): void
}

let listeners: LchCallbacks[] = []

function runListeners(
  list: LchCallbacks[],
  value: LchColor,
  prev: PrevCurrentValue
): void {
  let lChanged = prev.l !== value.l
  let cChanged = prev.c !== value.c
  let hChanged = prev.h !== value.h
  let start = Date.now()

  for (let i of list) {
    if (i.l && lChanged) {
      i.l(value.l)
    }
    if (i.c && cChanged) {
      i.c(value.c)
    }
    if (i.h && hChanged) {
      i.h(value.h)
    }
    if (i.alpha && prev.alpha !== value.alpha) {
      i.alpha(value.alpha)
    }

    if (i.lc && (lChanged || cChanged)) {
      i.lc(value)
    }
    if (i.ch && (cChanged || hChanged)) {
      i.ch(value)
    }
    if (i.lh && (lChanged || hChanged)) {
      i.lh(value)
    }
    if (i.lch && (lChanged || cChanged || hChanged)) {
      i.lch(value)
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
      prev = value
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
