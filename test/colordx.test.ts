import { ok } from 'node:assert'
import { test } from 'node:test'

import {
  lchToLinearSrgb,
  lchToRgbChannels,
  oklchToLinear,
  oklchToRgbChannels
} from '@colordx/core'
import { lchToP3Channels, linearToP3Channels } from '@colordx/core/plugins/p3'
import {
  lchToRec2020Channels,
  linearToRec2020Channels
} from '@colordx/core/plugins/rec2020'
import {
  modeLch,
  modeLrgb,
  modeOklch,
  modeP3,
  modeRec2020,
  modeRgb,
  useMode
} from 'culori/fn'

let toRgb = useMode(modeRgb)
let toLrgb = useMode(modeLrgb)
let toP3 = useMode(modeP3)
let toRec2020 = useMode(modeRec2020)
useMode(modeOklch)
useMode(modeLch)

// Sample OKLCH values covering sRGB, P3, Rec2020, and out-of-gamut
const CASES: [l: number, c: number, h: number][] = [
  [0.5, 0.0, 0],     // achromatic
  [0.5, 0.05, 180],  // low chroma — sRGB
  [0.7, 0.15, 145],  // mid green — P3
  [0.6, 0.25, 145],  // high chroma green — Rec2020
  [0.5, 0.37, 30],   // out of Rec2020
  [0.0, 0.0, 0],     // black
  [1.0, 0.0, 0]      // white
]

// Actual max diff between colordx and culori is ~1e-8 (floating-point noise only)
function close(
  actual: [number, number, number],
  ref: { b: number, g: number, r: number },
  label: string
): void {
  let [r, g, b] = actual
  let eps = 1e-6
  ok(Math.abs(r - ref.r) <= eps, `R mismatch at ${label}: colordx=${r} culori=${ref.r}`)
  ok(Math.abs(g - ref.g) <= eps, `G mismatch at ${label}: colordx=${g} culori=${ref.g}`)
  ok(Math.abs(b - ref.b) <= eps, `B mismatch at ${label}: colordx=${b} culori=${ref.b}`)
}

test('oklchToRgbChannels matches culori rgb conversion', () => {
  for (let [l, c, h] of CASES) {
    let [r, g, b] = oklchToRgbChannels(l, c, h)
    let ref = toRgb({ c, h, l, mode: 'oklch' })
    close([r, g, b], ref, `L=${l} C=${c} H=${h}`)
  }
})

test('oklchToLinear matches culori linear sRGB conversion', () => {
  for (let [l, c, h] of CASES) {
    let [lr, lg, lb] = oklchToLinear(l, c, h)
    let ref = toLrgb({ c, h, l, mode: 'oklch' })
    close([lr, lg, lb], ref, `L=${l} C=${c} H=${h}`)
  }
})

test('linearToP3Channels matches culori P3 conversion', () => {
  for (let [l, c, h] of CASES) {
    let [lr, lg, lb] = oklchToLinear(l, c, h)
    let [pr, pg, pb] = linearToP3Channels(lr, lg, lb)
    let ref = toP3({ b: lb, g: lg, mode: 'lrgb', r: lr })
    close([pr, pg, pb], ref, `L=${l} C=${c} H=${h}`)
  }
})

test('linearToRec2020Channels matches culori Rec2020 conversion', () => {
  for (let [l, c, h] of CASES) {
    let [lr, lg, lb] = oklchToLinear(l, c, h)
    let [rr, rg, rb] = linearToRec2020Channels(lr, lg, lb)
    let ref = toRec2020({ b: lb, g: lg, mode: 'lrgb', r: lr })
    close([rr, rg, rb], ref, `L=${l} C=${c} H=${h}`)
  }
})

// CIE LCH (D50) sample values covering sRGB, P3, Rec2020, and out-of-gamut
const LCH_CASES: [l: number, c: number, h: number][] = [
  [50, 0, 0], // achromatic
  [50, 10, 180], // low chroma — sRGB
  [60, 50, 145], // mid green — P3
  [60, 80, 145], // high chroma green — Rec2020
  [50, 120, 30], // out of Rec2020
  [0, 0, 0], // black
  [100, 0, 0] // white
]

test('lchToRgbChannels matches culori rgb(lch) conversion', () => {
  for (let [l, c, h] of LCH_CASES) {
    let [r, g, b] = lchToRgbChannels(l, c, h)
    let ref = toRgb({ c, h, l, mode: 'lch' as const })
    close([r, g, b], ref, `L=${l} C=${c} H=${h}`)
  }
})

test('lchToLinearSrgb matches culori lrgb(lch) conversion', () => {
  for (let [l, c, h] of LCH_CASES) {
    let [lr, lg, lb] = lchToLinearSrgb(l, c, h)
    let ref = toLrgb({ c, h, l, mode: 'lch' as const })
    close([lr, lg, lb], ref, `L=${l} C=${c} H=${h}`)
  }
})

test('lchToP3Channels matches culori p3(lch) conversion', () => {
  for (let [l, c, h] of LCH_CASES) {
    let [pr, pg, pb] = lchToP3Channels(l, c, h)
    let ref = toP3({ c, h, l, mode: 'lch' as const })
    close([pr, pg, pb], ref, `L=${l} C=${c} H=${h}`)
  }
})

test('lchToRec2020Channels matches culori rec2020(lch) conversion', () => {
  for (let [l, c, h] of LCH_CASES) {
    let [rr, rg, rb] = lchToRec2020Channels(l, c, h)
    let ref = toRec2020({ c, h, l, mode: 'lch' as const })
    close([rr, rg, rb], ref, `L=${l} C=${c} H=${h}`)
  }
})
