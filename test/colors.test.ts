import './set-globals.js'

import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

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
    l: 62.8
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#00ff00')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.2948272403370167,
    h: 142.49533888780996,
    l: 86.64396115356693
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#0000ff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.31321437166460125,
    h: 264.052020638055,
    l: 45.201371838534286
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#00ffff')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.15455001106436891,
    h: 194.76894793196382,
    l: 90.53992300557677
  })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ff00ff')
  deepStrictEqual(current.get(), { a: 100, c: 0.3225, h: 328.36, l: 70.17 })
  deepStrictEqual(visible.get().space, 'srgb')

  setCurrent('#ffff00')
  deepStrictEqual(current.get(), {
    a: 100,
    c: 0.211,
    h: 109.77,
    l: 96.8
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

test('rounds colors without hex changes', () => {
  setCurrent('#00daff')
  deepStrictEqual(formats.get().hex, '#00daff')

  setCurrent('#ffff00')
  deepStrictEqual(formats.get().hex, '#ffff00')
})
