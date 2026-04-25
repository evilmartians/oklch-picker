import './set-globals.ts'

import { deepStrictEqual, ok } from 'node:assert'
import { test } from 'node:test'

import {
  build,
  getSpace,
  inP3,
  inRec2020,
  inRGB,
  parseAnything,
  Space,
  toHex,
  toNativeString
} from '../lib/colors.ts'
import { colorToValue } from '../stores/current.ts'

function spaceFor(input: string): Space {
  let parsed = parseAnything(input)
  if (!parsed) throw new Error(`unparseable: ${input}`)
  return getSpace(parsed)
}

test('getSpace classifies sRGB colors', () => {
  deepStrictEqual(spaceFor('#ff0000'), Space.sRGB)
  deepStrictEqual(spaceFor('#808080'), Space.sRGB)
  deepStrictEqual(spaceFor('#ffffff'), Space.sRGB)
  deepStrictEqual(spaceFor('#000000'), Space.sRGB)
  deepStrictEqual(spaceFor('oklch(0.7 0.15 30)'), Space.sRGB)
})

test('getSpace classifies P3 colors', () => {
  deepStrictEqual(spaceFor('oklch(0.6 0.22 145)'), Space.P3)
})

test('getSpace classifies Rec2020 colors', () => {
  deepStrictEqual(spaceFor('oklch(0.6 0.26 145)'), Space.Rec2020)
})

test('getSpace classifies out-of-gamut colors', () => {
  deepStrictEqual(spaceFor('oklch(0.5 0.5 30)'), Space.Out)
  deepStrictEqual(spaceFor('oklch(0.6 0.3 145)'), Space.Out)
})

test('inRGB / inP3 / inRec2020 at gamut boundaries (h=145)', () => {
  // Just past sRGB, inside P3
  let p3Color = build(0.6, 0.22, 145)
  deepStrictEqual(inRGB(p3Color), false)
  deepStrictEqual(inP3(p3Color), true)
  deepStrictEqual(inRec2020(p3Color), true)

  // Just past P3, inside Rec2020
  let rec2020Color = build(0.6, 0.26, 145)
  deepStrictEqual(inRGB(rec2020Color), false)
  deepStrictEqual(inP3(rec2020Color), false)
  deepStrictEqual(inRec2020(rec2020Color), true)

  // Past Rec2020
  let outColor = build(0.6, 0.3, 145)
  deepStrictEqual(inRGB(outColor), false)
  deepStrictEqual(inP3(outColor), false)
  deepStrictEqual(inRec2020(outColor), false)

  // Deep inside sRGB
  let srgbColor = build(0.7, 0.15, 30)
  deepStrictEqual(inRGB(srgbColor), true)
  deepStrictEqual(inP3(srgbColor), true)
  deepStrictEqual(inRec2020(srgbColor), true)
})

test('parseAnything returns finite h for achromatic inputs (no NaN)', () => {
  for (let input of [
    '#000000',
    '#ffffff',
    '#808080',
    '#333',
    'rgb(128, 128, 128)',
    'oklch(0.5 0 0)',
    'oklch(0 0 0)',
    'oklch(1 0 0)'
  ]) {
    let color = parseAnything(input)
    if (!color) throw new Error(`unparseable: ${input}`)
    ok(
      Number.isFinite(color.h),
      `${input}: h must be finite, got ${color.h}`
    )
    ok(
      Number.isFinite(color.l),
      `${input}: l must be finite, got ${color.l}`
    )
    ok(
      Number.isFinite(color.c),
      `${input}: c must be finite, got ${color.c}`
    )
  }
})

test('colorToValue preserves finite h and l for achromatic inputs', () => {
  for (let input of ['#000000', '#ffffff', '#808080']) {
    let color = parseAnything(input)
    if (!color) throw new Error(`unparseable: ${input}`)
    let value = colorToValue(color)
    ok(Number.isFinite(value.h), `${input}: value.h must be finite`)
    ok(Number.isFinite(value.l), `${input}: value.l must be finite`)
  }
})

test('toNativeString on achromatic inputs produces valid CSS (no "NaN")', () => {
  for (let input of ['#000000', '#ffffff', '#808080']) {
    let color = parseAnything(input)
    if (!color) throw new Error(`unparseable: ${input}`)
    let css = toNativeString(color)
    ok(!css.includes('NaN'), `${input}: CSS must not contain NaN, got ${css}`)
  }
})

test('native-input parseAnything preserves typed precision', () => {
  // OKLCH build: native format is oklch()
  let c = parseAnything('oklch(0.628 0.2577 29.23)')
  if (!c) throw new Error('unparseable')
  deepStrictEqual(c.l, 0.628)
  deepStrictEqual(c.c, 0.2577)
  deepStrictEqual(c.h, 29.23)
})

test('toHex gamut-maps out-of-sRGB colors via CSS Color 4 chroma reduction', () => {
  let cases: { hex: string; input: string }[] = [
    { hex: '#c30000', input: 'oklch(0.5 0.5 30)' },
    { hex: '#14c000', input: 'oklch(0.7 0.4 140)' },
    { hex: '#ccddff', input: 'oklch(0.9 0.35 270)' },
    { hex: '#001e17', input: 'oklch(0.2 0.3 180)' }
  ]
  for (let { hex, input } of cases) {
    let parsed = parseAnything(input)
    if (!parsed) throw new Error(`unparseable: ${input}`)
    deepStrictEqual(toHex(parsed), hex, `hex mismatch for ${input}`)
  }
})
