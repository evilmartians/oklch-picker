import './set-globals.ts'

import { deepStrictEqual, strictEqual } from 'node:assert'
import { test } from 'node:test'

import { current, setCurrent } from '../stores/current.ts'

test('understands CSS declaration', () => {
  strictEqual(setCurrent('color: oklch(80% 0.1 195);'), true)
  deepStrictEqual(current.get(), { a: 100, c: 0.1, h: 195, l: 0.8 })

  strictEqual(setCurrent('color: #f00'), true)
  deepStrictEqual(current.get(), { a: 100, c: 0.2577, h: 29.23, l: 0.628 })
})

test('understands hex without #', () => {
  for (let [bare, prefixed] of [
    ['fff', '#fff'],
    ['ffff', '#ffff'],
    ['60a7d6', '#60a7d6'],
    ['60a7d680', '#60a7d680']
  ]) {
    strictEqual(setCurrent(prefixed), true)
    let expected = current.get()

    strictEqual(setCurrent(bare), true)
    deepStrictEqual(current.get(), expected)
  }
})

test('rejects invalid hex without #', () => {
  for (let input of ['ff', 'fffff', 'zzzzzz']) {
    strictEqual(setCurrent(input), false)
  }
})

test('understands OKLCH without function', () => {
  strictEqual(setCurrent('80% 0.1 195'), true)
  deepStrictEqual(current.get(), { a: 100, c: 0.1, h: 195, l: 0.8 })

  strictEqual(setCurrent('0.8 0.1 195'), true)
  deepStrictEqual(current.get(), { a: 100, c: 0.1, h: 195, l: 0.8 })
})
