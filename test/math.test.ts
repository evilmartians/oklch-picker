import { AssertionError } from 'node:assert'
import { test } from 'node:test'

import { computeExpression } from '../lib/math.ts'

const FLOAT_POINT_ERROR = 1e-10

function computes(input: string, expected: number): void {
  let actual = computeExpression(input)

  if (Math.abs(actual - expected) < FLOAT_POINT_ERROR) return;

  throw new AssertionError({
    actual,
    expected,
    message: `computeExpression(${JSON.stringify(input)})`,
    operator: 'strictEqual',
    stackStartFn: computes
  })
}

test('keeps existing behavior', () => {
  computes('0.1+0.', 0.1)
  computes('+0.1', 0.1)
  computes('0.2+0.3', 0.5)
  computes('0.9-0.5', 0.4)
})

test('ignores trailing operators in expressions', () => {
  computes('0.1+', 0.1)
  computes('0.1-', 0.1)
  computes('0.1*', 0.1)
  computes('0.1/', 0.1)
})

test('uses standard precedence and associativity', () => {
  computes('0.1+0.25*2', 0.6)
  computes('0.1+0.1+0.1-0.2', 0.1)
  computes('0.1*2+0.1*2', 0.4)
  computes('0.11*3+0.33/3+0', 0.44)
})

test('ignores whitespace', () => {
  computes(' 0.1 + 0.2 ', 0.3)
  computes(' 0.1 + 0.2 * 3 ', 0.7)
})
