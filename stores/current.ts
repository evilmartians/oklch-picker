import { clampChroma, Color } from 'culori/fn'
import { atom, map, onSet } from 'nanostores'

import { getSpace, build, oklch, lch, AnyLch } from '../lib/colors.js'
import { reportFreeze, benchmarking } from './benchmark.js'
import { settings } from './settings.js'
import { support } from './support.js'

export interface LchValue {
  l: number
  c: number
  h: number
  a: number
}

type PrevCurrentValue = LchValue | { [key in keyof LchValue]?: undefined }
type RenderStatus = Record<keyof LchValue | string, boolean>

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
export let postponed = atom<LchValue | null>(null)

export let isRendering = map<RenderStatus>({
  l: false,
  c: false,
  h: false,
  a: false
})
export let isFullRendered = map<RenderStatus>({
  l: false,
  c: false,
  h: false,
  // should be always true
  a: true
})

// update hash only when all graphs settled
onSet(isFullRendered, ({ newValue }) => {
  let fullRendered = Object.keys(newValue).every(key => newValue[key])
  if (!fullRendered) {
    return
  }

  let { l, c, h, a } = current.get()
  let hash = `#${l},${c},${h},${a}`
  if (location.hash !== hash) {
    history.pushState(null, '', `#${l},${c},${h},${a}`)
  }
})

window.addEventListener('hashchange', () => {
  let color = parseHash()
  if (color) current.set(color)
})

interface ComponentCallback {
  (
    value: number,
    showP3: boolean,
    showRec2020: boolean,
    showCharts: boolean,
    isFull: boolean
  ): void
}

interface LchCallback {
  (
    value: LchValue,
    showP3: boolean,
    showRec2020: boolean,
    showCharts: boolean
  ): void
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

let frame = 0

isRendering.subscribe(value => {
  let showCharts = settings.get().charts === 'show'
  if (!showCharts) {
    return
  }

  let postponedValue = postponed.get()

  let renderingType = Object.keys(value).find(key => value[key])
  let fullRendered = Object.keys(isFullRendered.get()).every(key => value[key])

  // no rendering happening and there is new postponed value
  if (
    !renderingType &&
    postponedValue &&
    Object.entries(postponedValue).sort().toString() !==
      Object.entries(current.get()).sort().toString()
  ) {
    cancelAnimationFrame(frame)
    current.set(postponedValue)
  } else if (!renderingType && !fullRendered) {
    // no rendering happening and there are graphs that need to fully render
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      postponed.set(null)
      current.set(current.get())
    })
  }
})

let changeListeners: LchCallbacks[] = []
let paintListeners: LchCallbacks[] = []

function runListeners(
  list: LchCallbacks[],
  prev: PrevCurrentValue,
  isFull: boolean = false
): void {
  let value = current.get()
  let lChanged = prev.l !== value.l
  let cChanged = prev.c !== value.c
  let hChanged = prev.h !== value.h
  let start = Date.now()

  let showP3 = settings.get().p3 === 'show'
  let showRec2020 = settings.get().rec2020 === 'show'
  let showCharts = settings.get().charts === 'show'

  let fullRenderedValue = isFullRendered.get()

  for (let i of list) {
    if (i.l && (lChanged || (!fullRenderedValue.l && isFull))) {
      isRendering.setKey('l', true)
      isFullRendered.setKey('l', isFull)

      i.l(value.l, showP3, showRec2020, showCharts, isFull)
    }
    if (i.c && (cChanged || (!fullRenderedValue.c && isFull))) {
      isRendering.setKey('c', true)
      isFullRendered.setKey('c', isFull)

      i.c(value.c, showP3, showRec2020, showCharts, isFull)
    }
    if (i.h && (hChanged || (!fullRenderedValue.h && isFull))) {
      isRendering.setKey('h', true)
      isFullRendered.setKey('h', isFull)

      i.h(value.h, showP3, showRec2020, showCharts, isFull)
    }
    if (i.alpha && prev.a !== value.a) {
      i.alpha(value.a, showP3, showRec2020, showCharts, isFull)
    }

    if (i.lc && (lChanged || cChanged)) {
      i.lc(value, showP3, showRec2020, showCharts)
    }
    if (i.ch && (cChanged || hChanged)) {
      i.ch(value, showP3, showRec2020, showCharts)
    }
    if (i.lh && (lChanged || hChanged)) {
      i.lh(value, showP3, showRec2020, showCharts)
    }
    if (i.lch && (lChanged || cChanged || hChanged)) {
      i.lch(value, showP3, showRec2020, showCharts)
    }
  }

  reportFreeze(Date.now() - start)
}

export function onCurrentChange(callbacks: LchCallbacks): void {
  changeListeners.push(callbacks)
  if (changeListeners.length === 1) {
    let prev: PrevCurrentValue = {}
    current.listen(value => {
      let postponedValue = postponed.get()
      // if there is no postponed frames we can render full scale
      let isFull = postponedValue === null

      runListeners(changeListeners, prev, isFull)
      prev = value
    })
  }
}

setTimeout(() => {
  runListeners(changeListeners, {})
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
    if (originSpace === 'srgb' && getSpace(accurate) !== 'srgb') {
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

settings.listen(() => {
  runListeners(changeListeners, {})
})

let media = window.matchMedia('(prefers-color-scheme: dark)')
media.addEventListener('change', () => {
  runListeners(paintListeners, {})
})
