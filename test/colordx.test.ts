import { ok } from 'node:assert'
import { test } from 'node:test'

import {
  modeLrgb,
  modeOklch,
  modeP3,
  modeRec2020,
  modeRgb,
  useMode
} from 'culori/fn'
import {
  oklchToLinear,
  oklchToRgbChannels
} from '@colordx/core'
import { linearToP3Channels } from '@colordx/core/plugins/p3'
import { linearToRec2020Channels } from '@colordx/core/plugins/rec2020'

let toRgb = useMode(modeRgb)
let toLrgb = useMode(modeLrgb)
let toP3 = useMode(modeP3)
let toRec2020 = useMode(modeRec2020)
useMode(modeOklch)

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
function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-6
}

test('oklchToRgbChannels matches culori rgb conversion', () => {
  for (let [l, c, h] of CASES) {
    let [r, g, b] = oklchToRgbChannels(l, c, h)
    let ref = toRgb({ mode: 'oklch', l, c, h })
    ok(close(r, ref.r), `R mismatch at L=${l} C=${c} H=${h}: colordx=${r} culori=${ref.r}`)
    ok(close(g, ref.g), `G mismatch at L=${l} C=${c} H=${h}: colordx=${g} culori=${ref.g}`)
    ok(close(b, ref.b), `B mismatch at L=${l} C=${c} H=${h}: colordx=${b} culori=${ref.b}`)
  }
})

test('oklchToLinear matches culori linear sRGB conversion', () => {
  for (let [l, c, h] of CASES) {
    let [lr, lg, lb] = oklchToLinear(l, c, h)
    let ref = toLrgb({ mode: 'oklch', l, c, h })
    ok(close(lr, ref.r), `R mismatch at L=${l} C=${c} H=${h}: colordx=${lr} culori=${ref.r}`)
    ok(close(lg, ref.g), `G mismatch at L=${l} C=${c} H=${h}: colordx=${lg} culori=${ref.g}`)
    ok(close(lb, ref.b), `B mismatch at L=${l} C=${c} H=${h}: colordx=${lb} culori=${ref.b}`)
  }
})

test('linearToP3Channels matches culori P3 conversion', () => {
  for (let [l, c, h] of CASES) {
    let [lr, lg, lb] = oklchToLinear(l, c, h)
    let [pr, pg, pb] = linearToP3Channels(lr, lg, lb)
    let ref = toP3({ mode: 'lrgb', r: lr, g: lg, b: lb })
    ok(close(pr, ref.r), `R mismatch at L=${l} C=${c} H=${h}: colordx=${pr} culori=${ref.r}`)
    ok(close(pg, ref.g), `G mismatch at L=${l} C=${c} H=${h}: colordx=${pg} culori=${ref.g}`)
    ok(close(pb, ref.b), `B mismatch at L=${l} C=${c} H=${h}: colordx=${pb} culori=${ref.b}`)
  }
})

test('linearToRec2020Channels matches culori Rec2020 conversion', () => {
  for (let [l, c, h] of CASES) {
    let [lr, lg, lb] = oklchToLinear(l, c, h)
    let [rr, rg, rb] = linearToRec2020Channels(lr, lg, lb)
    let ref = toRec2020({ mode: 'lrgb', r: lr, g: lg, b: lb })
    ok(close(rr, ref.r), `R mismatch at L=${l} C=${c} H=${h}: colordx=${rr} culori=${ref.r}`)
    ok(close(rg, ref.g), `G mismatch at L=${l} C=${c} H=${h}: colordx=${rg} culori=${ref.g}`)
    ok(close(rb, ref.b), `B mismatch at L=${l} C=${c} H=${h}: colordx=${rb} culori=${ref.b}`)
  }
})
