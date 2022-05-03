import { map, onSet } from 'nanostores'

import { reportFreeze, benchmarking } from './benchmark.js'
import { LchColor, Color, build, oklch, lch } from '../../lib/colors.js'
import { settings } from './settings.js'

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
  l?(value: number, p3: boolean, rec2020: boolean): void
  c?(value: number, p3: boolean, rec2020: boolean): void
  h?(value: number, p3: boolean, rec2020: boolean): void
  alpha?(value: number, p3: boolean, rec2020: boolean): void
  lc?(color: LchValue, p3: boolean, rec2020: boolean): void
  ch?(color: LchValue, p3: boolean, rec2020: boolean): void
  lh?(color: LchValue, p3: boolean, rec2020: boolean): void
  lch?(color: LchValue, p3: boolean, rec2020: boolean): void
}

let changeListeners: LchCallbacks[] = []
let paintListeners: LchCallbacks[] = []

function runListeners(list: LchCallbacks[], prev: PrevCurrentValue): void {
  let value = current.get()
  let lChanged = prev.l !== value.l
  let cChanged = prev.c !== value.c
  let hChanged = prev.h !== value.h
  let start = Date.now()

  let p3 = settings.get().p3 === 'show'
  let rec2020 = settings.get().rec2020 === 'show'

  for (let i of list) {
    if (i.l && lChanged) {
      i.l(value.l, p3, rec2020)
    }
    if (i.c && cChanged) {
      i.c(value.c, p3, rec2020)
    }
    if (i.h && hChanged) {
      i.h(value.h, p3, rec2020)
    }
    if (i.alpha && prev.a !== value.a) {
      i.alpha(value.a, p3, rec2020)
    }

    if (i.lc && (lChanged || cChanged)) {
      i.lc(value, p3, rec2020)
    }
    if (i.ch && (cChanged || hChanged)) {
      i.ch(value, p3, rec2020)
    }
    if (i.lh && (lChanged || hChanged)) {
      i.lh(value, p3, rec2020)
    }
    if (i.lch && (lChanged || cChanged || hChanged)) {
      i.lch(value, p3, rec2020)
    }
  }

  reportFreeze(Date.now() - start)
}

export function onCurrentChange(callbacks: LchCallbacks): void {
  changeListeners.push(callbacks)
  if (changeListeners.length === 1) {
    let prev: PrevCurrentValue = {}
    current.subscribe(value => {
      runListeners(changeListeners, prev)
      prev = value
    })
    settings.listen(() => {
      runListeners(changeListeners, {})
    })
  } else {
    runListeners([callbacks], {})
  }
}

export function onPaint(callbacks: LchCallbacks): void {
  onCurrentChange(callbacks)

  paintListeners.push(callbacks)
  settings.listen(() => {
    runListeners(paintListeners, {})
  })
}

function round2(value: number): number {
  return parseFloat(value.toFixed(2))
}

function round3(value: number): number {
  return parseFloat(value.toFixed(2))
}

export function setCurrentFromColor(color: Color): void {
  if (color.mode === COLOR_FN) {
    current.set(colorToValue(color as LchColor))
  } else {
    let value = colorToValue(COLOR_FN === 'oklch' ? oklch(color) : lch(color))
    current.set({
      l: round2(value.l),
      c: COLOR_FN === 'oklch' ? round3(value.c) : round2(value.c),
      h: round2(value.h),
      a: round2(value.a)
    })
  }
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
    runListeners(paintListeners, {})
  }
})
