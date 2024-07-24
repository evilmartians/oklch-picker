import type { Color } from 'culori/fn'
import { map } from 'nanostores'

import {
  type AnyLch,
  build,
  getSpace,
  lch,
  oklch,
  Space,
  toRgb
} from '../lib/colors.js'
import { debounce } from '../lib/time.js'
import { reportFreeze, startPainting } from './benchmark.js'
import { showCharts, showP3, showRec2020 } from './settings.js'
import { support } from './support.js'
import { benchmarking } from './url.js'

export interface LchValue {
  a: number
  c: number
  h: number
  l: number
}

type PrevCurrentValue = { [key in keyof LchValue]?: undefined } | LchValue

function randomColor(): LchValue {
  return { a: 100, c: C_RANDOM, h: Math.round(360 * Math.random()), l: 70 }
}

function parseHash(): LchValue | undefined {
  let parts = location.hash.slice(1).split(',')
  if (parts.length === 4) {
    if (parts.every(i => /^\d+(\.\d+)?$/.test(i))) {
      return {
        a: parseFloat(parts[3]),
        c: parseFloat(parts[1]),
        h: parseFloat(parts[2]),
        l: parseFloat(parts[0])
      }
    }
  }
  return undefined
}

export let current = map<LchValue>(parseHash() || randomColor())

current.subscribe(
  debounce(100, () => {
    let { a, c, h, l } = current.get()
    let hash = `#${l},${c},${h},${a}`
    if (location.hash !== hash) {
      history.pushState(null, '', `#${l},${c},${h},${a}`)
    }
  })
)

window.addEventListener('hashchange', () => {
  let color = parseHash()
  if (color) current.set(color)
})

interface ComponentCallback {
  (value: number, chartsToChange: number): void
}

interface LchCallback {
  (value: LchValue): void
}

interface LchCallbacks {
  alpha?: ComponentCallback
  c?: ComponentCallback
  ch?: LchCallback
  h?: ComponentCallback
  l?: ComponentCallback
  lc?: LchCallback
  lch?: LchCallback
  lh?: LchCallback
}

let changeListeners: LchCallbacks[] = []
let paintListeners: LchCallbacks[] = []

function runListeners(list: LchCallbacks[], prev: PrevCurrentValue): void {
  startPainting()
  reportFreeze(() => {
    let chartsToChange = 0
    let value = current.get()
    let lChanged = prev.l !== value.l
    let cChanged = prev.c !== value.c
    let hChanged = prev.h !== value.h

    if (lChanged && cChanged && hChanged) {
      chartsToChange = 3
    } else if (
      (lChanged && cChanged) ||
      (cChanged && hChanged) ||
      (hChanged && lChanged)
    ) {
      chartsToChange = 2
    } else {
      chartsToChange = 1
    }

    for (let i of list) {
      if (i.l && lChanged) {
        i.l(value.l, chartsToChange)
      }
      if (i.c && cChanged) {
        i.c(value.c, chartsToChange)
      }
      if (i.h && hChanged) {
        i.h(value.h, chartsToChange)
      }
      if (i.alpha && prev.a !== value.a) {
        i.alpha(value.a, 0)
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
  })
}

export function onCurrentChange(callbacks: LchCallbacks): void {
  changeListeners.push(callbacks)
}

let prev: PrevCurrentValue = {}
setTimeout(() => {
  runListeners(changeListeners, {})
  prev = current.get()

  current.listen(value => {
    runListeners(changeListeners, prev)
    prev = value
  })
}, 1)

export function onPaint(callbacks: LchCallbacks): void {
  onCurrentChange(callbacks)
  paintListeners.push(callbacks)
}

function round2(value: number): number {
  return parseFloat(value.toFixed(2))
}

function round3(value: number): number {
  return parseFloat(value.toFixed(3))
}

function roundValue<V extends Partial<LchValue>>(
  value: V,
  type: 'lch' | 'oklch'
): V {
  let rounded = { ...value }
  if (typeof rounded.l !== 'undefined') {
    rounded.l = round2(rounded.l)
  }
  if (typeof rounded.c !== 'undefined') {
    rounded.c = type === 'oklch' ? round3(rounded.c) : round2(rounded.c)
  }
  if (typeof rounded.h !== 'undefined') {
    rounded.h = round2(rounded.h)
  }
  if (typeof rounded.a !== 'undefined') {
    rounded.a = round2(rounded.a)
  }
  return rounded
}

export function setCurrentFromColor(origin: Color): void {
  if (origin.mode === COLOR_FN) {
    current.set(colorToValue(origin as AnyLch))
  } else {
    let originSpace = getSpace(origin)
    let accurate = LCH ? lch(origin) : oklch(origin)
    if (originSpace === Space.sRGB && getSpace(accurate) !== Space.sRGB) {
      let rgbAccurate = toRgb(accurate)
      accurate = LCH ? lch(rgbAccurate) : oklch(rgbAccurate)
    }
    let rounded = roundValue(colorToValue(accurate), COLOR_FN)
    if (getSpace(valueToColor(rounded)) === originSpace) {
      current.set(rounded)
    } else {
      current.set(colorToValue(accurate))
    }
  }
}

export function valueToColor(value: LchValue): AnyLch {
  return build((L_MAX * value.l) / 100, value.c, value.h, value.a / 100)
}

export function colorToValue(color: AnyLch): LchValue {
  return {
    a: (color.alpha ?? 1) * 100,
    c: color.c,
    h: color.h ?? 0,
    l: (100 * color.l) / L_MAX
  }
}

export function toOtherValue(from: LchValue): LchValue {
  let color = valueToColor(from)
  let to = colorToValue(LCH ? oklch(color) : lch(color))
  if (!LCH) {
    to.l /= 100
  } else {
    to.l *= 100
  }
  return roundValue(to, LCH ? 'oklch' : 'lch')
}

export function setCurrentComponents(parts: Partial<LchValue>): void {
  let value = current.get()
  let rounded = roundValue(parts, COLOR_FN)
  current.set({
    a: value.a,
    c: typeof rounded.c === 'undefined' ? value.c : rounded.c,
    h: typeof rounded.h === 'undefined' ? value.h : rounded.h,
    l: typeof rounded.l === 'undefined' ? value.l : rounded.l
  })
}

benchmarking.listen(enabled => {
  if (enabled) {
    runListeners(paintListeners, {})
  }
})

support.listen(() => {
  runListeners(paintListeners, {})
})

showRec2020.listen(() => {
  runListeners(paintListeners, {})
})

showP3.listen(() => {
  runListeners(paintListeners, {})
})

showCharts.listen(show => {
  if (show) {
    setTimeout(() => {
      runListeners(paintListeners, {})
    }, 400)
  }
})

let media = window.matchMedia('(prefers-color-scheme: dark)')
media.addEventListener('change', () => {
  runListeners(paintListeners, {})
})
