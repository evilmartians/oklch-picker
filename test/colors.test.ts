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
