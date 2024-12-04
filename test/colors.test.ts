import './set-globals.js'

import { equal } from 'node:assert'
import { test } from 'node:test'

import { setCurrent } from '../stores/current.ts'

test('setCurrent', () => {
  equal(typeof setCurrent, 'function')
})
