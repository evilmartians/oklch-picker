import './set-globals.js'

import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import { current, setCurrent } from '../stores/current.ts'

test('understands CSS declaration', () => {
  setCurrent('color: oklch(80% 0.1 195);')
  deepStrictEqual(current.get(), { a: 100, c: 0.1, h: 195, l: 0.8 })

  setCurrent('color: #f00')
  deepStrictEqual(current.get(), { a: 100, c: 0.2577, h: 29.23, l: 0.628 })
})

test('understands hex without #', () => {
  setCurrent('f00')
  deepStrictEqual(current.get(), { a: 100, c: 0.2577, h: 29.23, l: 0.628 })

  setCurrent('ff0000')
  deepStrictEqual(current.get(), { a: 100, c: 0.2577, h: 29.23, l: 0.628 })
})

test('understands OKLCH without function', () => {
  setCurrent('80% 0.1 195')
  deepStrictEqual(current.get(), { a: 100, c: 0.1, h: 195, l: 0.8 })

  setCurrent('0.8 0.1 195')
  deepStrictEqual(current.get(), { a: 100, c: 0.1, h: 195, l: 0.8 })
})
