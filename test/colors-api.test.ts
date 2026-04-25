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
  toHex8,
  toRgb
} from '../lib/colors.ts'

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

test('toRgb gamut-maps out-of-sRGB to in-gamut and preserves hex output', () => {
  // Known hex targets were captured from current culori pipeline.
  let cases: { hex: string; input: string }[] = [
    { hex: '#c30000', input: 'oklch(0.5 0.5 30)' },
    { hex: '#14c000', input: 'oklch(0.7 0.4 140)' },
    { hex: '#ccddff', input: 'oklch(0.9 0.35 270)' },
    { hex: '#001e17', input: 'oklch(0.2 0.3 180)' }
  ]
  for (let { hex, input } of cases) {
    let parsed = parseAnything(input)
    if (!parsed) throw new Error(`unparseable: ${input}`)
    let mapped = toRgb(parsed)
    ok(inRGB(mapped), `${input} should map into sRGB`)
    // 8-digit hex, drop the alpha byte
    let actualHex = toHex8(mapped).slice(0, 7)
    deepStrictEqual(actualHex, hex, `hex mismatch for ${input}`)
  }
})
