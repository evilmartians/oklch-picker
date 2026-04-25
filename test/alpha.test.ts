import './set-globals.ts'

import { deepStrictEqual } from 'node:assert'
import { test } from 'node:test'

import { current, setCurrent } from '../stores/current.ts'
import { formats } from '../stores/formats.ts'

test('setCurrent with 8-char hex stores correct alpha', () => {
  setCurrent('#ff000080')
  deepStrictEqual(current.get(), { a: 50.2, c: 0.2577, h: 29.23, l: 0.628 })

  setCurrent('#00000040')
  deepStrictEqual(current.get(), { a: 25.1, c: 0, h: 0, l: 0 })

  setCurrent('#ff000000')
  deepStrictEqual(current.get(), { a: 0, c: 0.2577, h: 29.23, l: 0.628 })
})

test('setCurrent with 8-char hex round-trips through formats.hex', () => {
  for (let input of ['#ff000080', '#00000040', '#ff000000', '#12345678']) {
    setCurrent(input)
    deepStrictEqual(formats.get().hex, input)
  }
})

test('setCurrent with oklch(… / alpha) stores and round-trips to hex8', () => {
  setCurrent('oklch(0.628 0.2577 29.23 / 0.5)')
  deepStrictEqual(current.get(), { a: 50, c: 0.2577, h: 29.23, l: 0.628 })
  deepStrictEqual(formats.get().hex, '#ff000080')
})

test('setCurrent with rgba() input stores alpha', () => {
  setCurrent('rgba(255, 0, 0, 0.5)')
  deepStrictEqual(current.get(), { a: 50, c: 0.2577, h: 29.23, l: 0.628 })
  deepStrictEqual(formats.get().hex, '#ff000080')
})
