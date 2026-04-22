import './set-globals.ts'

import { deepStrictEqual, ok } from 'node:assert'
import { test } from 'node:test'

import { setCurrent } from '../stores/current.ts'
import { support } from '../stores/support.ts'
import { visible } from '../stores/visible.ts'

function visibleFor(
  input: string,
  p3: boolean,
  rec2020: boolean
): ReturnType<typeof visible.get> {
  support.set({ p3, rec2020 })
  setCurrent(input)
  return visible.get()
}

test('sRGB color: space=srgb regardless of support', () => {
  for (let p3 of [false, true]) {
    for (let rec2020 of [false, true]) {
      let v = visibleFor('#ff0000', p3, rec2020)
      deepStrictEqual(v.space, 'srgb')
      deepStrictEqual(v.fallback, 'rgb(255.02, -0.01, 0.07)')
      deepStrictEqual(v.real, 'rgb(255.02, -0.01, 0.07)')
      deepStrictEqual(v.color, {
        alpha: 1,
        c: 0.2577,
        h: 29.23,
        l: 0.628,
        mode: 'oklch'
      })
    }
  }
})

test('sRGB color with alpha', () => {
  let v = visibleFor('#ff000080', false, false)
  deepStrictEqual(v.space, 'srgb')
  deepStrictEqual(v.fallback, 'rgba(255.02, -0.01, 0.07, 0.502)')
  deepStrictEqual(v.real, 'rgba(255.02, -0.01, 0.07, 0.502)')
  deepStrictEqual(v.color, {
    alpha: 0.502,
    c: 0.2577,
    h: 29.23,
    l: 0.628,
    mode: 'oklch'
  })
})

test('P3 color with P3 support → real is oklch, color is oklch', () => {
  let v = visibleFor('oklch(0.6 0.22 145)', true, false)
  deepStrictEqual(v.space, 'p3')
  deepStrictEqual(v.fallback, 'rgb(0, 158.78, 0)')
  deepStrictEqual(v.real, 'oklch(0.6 0.22 145)')
  deepStrictEqual(v.color, {
    alpha: 1,
    c: 0.22,
    h: 145,
    l: 0.6,
    mode: 'oklch'
  })
})

test('P3 color without P3 support → real is false, color is rgb fallback', () => {
  let v = visibleFor('oklch(0.6 0.22 145)', false, false)
  deepStrictEqual(v.space, 'p3')
  deepStrictEqual(v.fallback, 'rgb(0, 158.78, 0)')
  deepStrictEqual(v.real, false)
  ok(
    typeof v.color === 'object' && v.color !== null && 'mode' in v.color &&
      (v.color as { mode: string }).mode === 'rgb'
  )
})

test('Rec2020 color with Rec2020 support → real is oklch, color is oklch', () => {
  let v = visibleFor('oklch(0.6 0.26 145)', false, true)
  deepStrictEqual(v.space, 'rec2020')
  deepStrictEqual(v.fallback, 'rgb(0, 159.05, 0)')
  deepStrictEqual(v.real, 'oklch(0.6 0.26 145)')
  deepStrictEqual(v.color, {
    alpha: 1,
    c: 0.26,
    h: 145,
    l: 0.6,
    mode: 'oklch'
  })
})

test('Rec2020 color without Rec2020 support → real is false, color is rgb fallback', () => {
  let v = visibleFor('oklch(0.6 0.26 145)', true, false)
  deepStrictEqual(v.space, 'rec2020')
  deepStrictEqual(v.fallback, 'rgb(0, 159.05, 0)')
  deepStrictEqual(v.real, false)
  ok(
    typeof v.color === 'object' && v.color !== null && 'mode' in v.color &&
      (v.color as { mode: string }).mode === 'rgb'
  )
})

test('out-of-gamut color: space=out, real=false, color is rgb fallback', () => {
  for (let p3 of [false, true]) {
    for (let rec2020 of [false, true]) {
      let v = visibleFor('oklch(0.5 0.5 30)', p3, rec2020)
      deepStrictEqual(v.space, 'out')
      deepStrictEqual(v.fallback, 'rgb(195.33, 0, 0)')
      deepStrictEqual(v.real, false)
      ok(
        typeof v.color === 'object' && v.color !== null && 'mode' in v.color &&
          (v.color as { mode: string }).mode === 'rgb'
      )
    }
  }
})
