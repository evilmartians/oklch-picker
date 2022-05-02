import { map, onSet } from 'nanostores'

import { reportFreeze, benchmarking } from './benchmark.js'
import { LchColor, build } from '../../lib/colors.js'

export interface LchValue {
  l: number
  c: number
  h: number
  a: number
}

type PrevCurrentValue = LchValue | { [key in keyof LchValue]?: undefined }

function randomColor(): LchValue {
  return { l: 70, c: C_RANDOM, h: Math.round(360 * Math.random()), a: 100 }
}

function parseHash(): LchValue | undefined {
  let parts = location.hash.slice(1).split(',')
  if (parts.length === 4) {
    if (parts.every(i => /^\d+(\.\d+)?$/.test(i))) {
      return {
        l: parseFloat(parts[0]),
        c: parseFloat(parts[1]),
        h: parseFloat(parts[2]),
        a: parseFloat(parts[3])
      }
    }
  }
  return undefined
}

export let current = map<LchValue>(parseHash() || randomColor())

onSet(current, ({ newValue }) => {
  let { l, c, h, a } = newValue
  let hash = `#${l},${c},${h},${a}`
  if (location.hash !== hash) {
    history.pushState(null, '', `#${l},${c},${h},${a}`)
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
    if (i.alpha && prev.a !== value.a) {
      i.alpha(value.a)
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

  reportFreeze(Date.now() - start)
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
  let value = colorToValue(color)
  current.set({
    l: Math.round(100 * value.l) / 100,
    c: Math.round(100 * value.c) / 100,
    h: Math.round(100 * value.h) / 100,
    a: Math.round(100 * value.a) / 100
  })
}

export function valueToColor(value: LchValue): LchColor {
  return build((L_MAX * value.l) / 100, value.c, value.h, value.a / 100)
}

export function colorToValue(color: LchColor): LchValue {
  return {
    l: (100 * color.l) / L_MAX,
    c: color.c,
    h: color.h ?? 0,
    a: (color.alpha ?? 1) * 100
  }
}

benchmarking.listen(enabled => {
  if (enabled) {
    runListeners(listeners, current.get(), {})
  }
})
