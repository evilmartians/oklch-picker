import './set-globals.js'

import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import { current, setCurrent } from '../stores/current.ts'
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
    c: 0.25768330773615683,
    h: 29.2338851923426,
    l: 62.795536061455145
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#00ff00')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.2947552610302938,
    h: 142.49533888780996,
    l: 86.64396115356695
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#0000ff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.31313625765874376,
    h: 264.05300810418345,
    l: 45.20157870253896
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#00ffff')
  deepStrictEqual(current.get(), { a: 100, c: 0.1545, h: 194.77, l: 90.54 })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ff00ff')
  deepStrictEqual(current.get(), { a: 100, c: 0.3224, h: 328.36, l: 70.17 })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ffff00')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.21095439261133309,
    h: 109.76923207652135,
    l: 96.79827203267874
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ffffff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0,
    h: 0,
    l: 100
  })
  deepStrictEqual(visible.get().space, 'srgb')
})
