import { map, onSet } from 'nanostores'

import { reportBenchmark, benchmarking } from './benchmark.js'
import { LchColor } from '../../lib/colors.js'

export interface LchValue {
  l: number
  c: number
  h: number
  alpha: number
}

type PrevCurrentValue = LchValue | { [key in keyof LchValue]?: undefined }

function randomColor(): LchValue {
  return { l: 0.7, c: 0.1, h: Math.round(360 * Math.random()), alpha: 1 }
}

function parseHash(): LchValue | undefined {
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

export let current = map<LchValue>(parseHash() || randomColor())

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
  lc?(color: LchValue): void
  ch?(color: LchValue): void
  lh?(color: LchValue): void
  lch?(color: LchValue): void
}

let listeners: LchCallbacks[] = []

function runListeners(
  list: LchCallbacks[],
  value: LchValue,
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

export function setCurrentRound(color: LchColor): void {
  current.set({
    l: Math.round(100 * color.l) / 100,
    c: Math.round(100 * color.c) / 100,
    h: Math.round(100 * (color.h ?? 0)) / 100,
    alpha: color.alpha ?? 1
  })
}

benchmarking.listen(enabled => {
  if (enabled) {
    runListeners(listeners, current.get(), {})
  }
})
