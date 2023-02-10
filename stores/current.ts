import { clampChroma, Color } from 'culori/fn'
import { map } from 'nanostores'

import { reportFreeze, benchmarking, resetCollecting } from './benchmark.js'
import { getSpace, build, oklch, lch, AnyLch, Space } from '../lib/colors.js'
import { showRec2020, showP3, showCharts, showModel } from './settings.js'
import { debounce } from '../lib/time.js'
import { support } from './support.js'

export interface LchValue {
  l: number
  c: number
  h: number
  a: number
}

type PrevCurrentValue = LchValue | { [key in keyof LchValue]?: undefined }

let generateModel: Function | undefined

function randomColor(): LchValue {
  return { l: 70, c: C_RANDOM, h: Math.round(360 * Math.random()), a: 100 }
}

function parseHash(): LchValue | undefined {
  let parts
  if (location.hash.includes('?3d')) {
    showModel.set(true)
    parts = location.hash.slice(1, location.hash.indexOf('?')).split(',')
  } else {
    parts = location.hash.slice(1).split(',')
  }
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

//TODO add loader
export async function loadModel(): Promise<void> {
  await import('../view/model/index.js').then(bundle => {
    generateModel = bundle.generateModel
  })
}

export let current = map<LchValue>(parseHash() || randomColor())

let full = { l: false, c: false, h: false }

current.subscribe(
  debounce(100, () => {
    let { l, c, h, a } = current.get()
    let hash = `#${l},${c},${h},${a}`
    let model = ''
    if (showModel.get()) {
      loadModel()
      model = '?3d'
    }
    if (location.hash !== hash) {
      history.pushState(null, '', `#${l},${c},${h},${a}${model}`)
    }
  })
)

window.addEventListener('hashchange', () => {
  let color = parseHash()
  if (color) current.set(color)
})

interface ComponentCallback {
  (value: number, isFull: boolean): void
}

interface LchCallback {
  (value: LchValue, isFull: boolean): void
}

interface LchCallbacks {
  l?: ComponentCallback
  c?: ComponentCallback
  h?: ComponentCallback
  alpha?: ComponentCallback
  lc?: LchCallback
  ch?: LchCallback
  lh?: LchCallback
  lch?: LchCallback
}

let changeListeners: LchCallbacks[] = []
let paintListeners: LchCallbacks[] = []

let delayFullRepaint = debounce(100, (prev: PrevCurrentValue) => {
  if (!full.l || !full.c || !full.h) {
    runListeners(changeListeners, prev)
  }
})

function runListeners(
  list: LchCallbacks[],
  prev: PrevCurrentValue,
  isFull = true
): void {
  let start = Date.now()

  let value = current.get()
  let lChanged = prev.l !== value.l
  let cChanged = prev.c !== value.c
  let hChanged = prev.h !== value.h

  if (isFull) {
    if (!full.l) lChanged = true
    if (!full.c) cChanged = true
    if (!full.h) hChanged = true
    full = { l: true, c: true, h: true }
  } else {
    if (lChanged) full.l = false
    if (cChanged) full.c = false
    if (hChanged) full.h = false
  }

  for (let i of list) {
    if (i.l && lChanged) {
      i.l(value.l, isFull)
    }
    if (i.c && cChanged) {
      i.c(value.c, isFull)
    }
    if (i.h && hChanged) {
      i.h(value.h, isFull)
    }
    if (i.alpha && prev.a !== value.a) {
      i.alpha(value.a, isFull)
    }

    if (i.lc && (lChanged || cChanged)) {
      i.lc(value, isFull)
    }
    if (i.ch && (cChanged || hChanged)) {
      i.ch(value, isFull)
    }
    if (i.lh && (lChanged || hChanged)) {
      i.lh(value, isFull)
    }
    if (i.lch && (lChanged || cChanged || hChanged)) {
      i.lch(value, isFull)
    }
  }

  if (!isFull) delayFullRepaint(prev)

  reportFreeze(Date.now() - start)
}

export function onCurrentChange(callbacks: LchCallbacks): void {
  changeListeners.push(callbacks)
}

let prev: PrevCurrentValue = {}
setTimeout(() => {
  runListeners(changeListeners, {})
  prev = current.get()

  current.listen(value => {
    resetCollecting()
    runListeners(changeListeners, prev, false)
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
  type: 'oklch' | 'lch'
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
      accurate = clampChroma(accurate, COLOR_FN) as AnyLch
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
    l: (100 * color.l) / L_MAX,
    c: color.c,
    h: color.h ?? 0,
    a: (color.alpha ?? 1) * 100
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
    l: typeof rounded.l === 'undefined' ? value.l : rounded.l,
    c: typeof rounded.c === 'undefined' ? value.c : rounded.c,
    h: typeof rounded.h === 'undefined' ? value.h : rounded.h,
    a: value.a
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
  if (showModel.get()) {
    generateModel!()
  }
  runListeners(paintListeners, {})
})

showP3.listen(() => {
  if (showModel.get() && !showRec2020.get()) {
    generateModel!()
  }
  runListeners(paintListeners, {})
})

showCharts.listen(show => {
  if (show) {
    setTimeout(() => {
      runListeners(paintListeners, {})
    }, 400)
  }
})

showModel.listen(show => {
  if (show) {
    !generateModel && loadModel()
    history.pushState(null, '', `${location.hash}?3d`)
  } else {
    let { l, c, h, a } = current.get()
    history.pushState(null, '', `#${l},${c},${h},${a}`)
  }
})

let media = window.matchMedia('(prefers-color-scheme: dark)')
media.addEventListener('change', () => {
  runListeners(paintListeners, {})
})
