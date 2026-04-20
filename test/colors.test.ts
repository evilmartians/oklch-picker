import './set-globals.ts'

import { deepStrictEqual, ok } from 'node:assert'
import { test } from 'node:test'

import { build, generateGetPixel, Space } from '../lib/colors.ts'
import { current, setCurrent } from '../stores/current.ts'
import { formats } from '../stores/formats.ts'
import { visible } from '../stores/visible.ts'

test('correctly works with colors on the edges of sRGB', () => {
  setCurrent('#000000')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0,
    h: 0,
    l: 0
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ff0000')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.2577,
    h: 29.23,
    l: 0.628
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#00ff00')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.294827,
    h: 142.4953,
    l: 0.86644
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#0000ff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.313214,
    h: 264.052,
    l: 0.452014
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#00ffff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.15455,
    h: 194.769,
    l: 0.905399
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ff00ff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.3225,
    h: 328.36,
    l: 0.7017
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ffff00')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.211,
    h: 109.77,
    l: 0.968
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ffffff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0,
    h: 0,
    l: 1
  })
  deepStrictEqual(visible.get().space, 'srgb')
})

test('rounds colors without hex changes', () => {
  setCurrent('#00daff')
  deepStrictEqual(formats.get().hex, '#00daff')

  setCurrent('#ffff00')
  deepStrictEqual(formats.get().hex, '#ffff00')
})

test('generateGetPixel classifies sRGB color as Space.sRGB in all modes', () => {
  let srgb = build(0.5, 0.05, 180) // low chroma — always in sRGB
  for (let showP3 of [false, true]) {
    for (let showRec2020 of [false, true]) {
      for (let p3Support of [false, true]) {
        let [space] = generateGetPixel(() => srgb, showP3, showRec2020, p3Support)(0, 0)
        deepStrictEqual(space, Space.sRGB, `expected sRGB for showP3=${showP3} showRec2020=${showRec2020} p3Support=${p3Support}`)
      }
    }
  }
})

test('generateGetPixel classifies P3 color as Space.P3 when P3 enabled', () => {
  let p3Color = build(0.6, 0.22, 145) // outside sRGB, inside P3
  for (let p3Support of [false, true]) {
    let [space] = generateGetPixel(() => p3Color, true, false, p3Support)(0, 0)
    deepStrictEqual(space, Space.P3, `expected P3 for p3Support=${p3Support}`)
  }
})

test('generateGetPixel classifies Rec2020 color as Space.Rec2020 when Rec2020 enabled', () => {
  let rec2020Color = build(0.6, 0.26, 145) // outside P3, inside Rec2020
  for (let p3Support of [false, true]) {
    let [space] = generateGetPixel(() => rec2020Color, false, true, p3Support)(0, 0)
    deepStrictEqual(space, Space.Rec2020, `expected Rec2020 for p3Support=${p3Support}`)
  }
})

test('generateGetPixel out-of-gamut is Space.Out in all modes', () => {
  let outOfGamut = build(0.5, 0.4, 30) // very high chroma — outside Rec2020
  for (let showP3 of [false, true]) {
    for (let showRec2020 of [false, true]) {
      for (let p3Support of [false, true]) {
        let [space] = generateGetPixel(() => outOfGamut, showP3, showRec2020, p3Support)(0, 0)
        deepStrictEqual(space, Space.Out, `expected Out for showP3=${showP3} showRec2020=${showRec2020} p3Support=${p3Support}`)
      }
    }
  }
})

test('generateGetPixel pixel values are in [0,255] for in-gamut colors', () => {
  let cases = [
    build(0.0, 0.0, 0),
    build(0.5, 0.0, 0),
    build(1.0, 0.0, 0),
    build(0.5, 0.02, 180)
  ]
  for (let p3Support of [false, true]) {
    let getPixel = generateGetPixel(x => cases[x], true, true, p3Support)
    for (let i = 0; i < cases.length; i++) {
      let [, r, g, b] = getPixel(i, 0)
      ok(r >= 0 && r <= 255, `r out of range for case ${i} p3Support=${p3Support}: ${r}`)
      ok(g >= 0 && g <= 255, `g out of range for case ${i} p3Support=${p3Support}: ${g}`)
      ok(b >= 0 && b <= 255, `b out of range for case ${i} p3Support=${p3Support}: ${b}`)
    }
  }
})
