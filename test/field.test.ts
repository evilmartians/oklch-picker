import './set-globals.ts'

import { strictEqual } from 'node:assert'
import { test } from 'node:test'

import { setSpinbuttonValue, syncSpinbuttonAria } from '../view/field/aria.ts'

function createInput(value: string): HTMLInputElement {
  let input = document.createElement('input')
  input.setAttribute('role', 'spinbutton')
  input.value = value
  return input
}

test('sets aria-valuenow for numeric text', () => {
  let input = createInput('0.25')

  syncSpinbuttonAria(input)

  strictEqual(input.getAttribute('aria-valuenow'), '0.25')
  strictEqual(input.hasAttribute('aria-valuetext'), false)
})

test('removes aria-valuenow for trailing operators', () => {
  let input = createInput('1+')

  syncSpinbuttonAria(input)

  strictEqual(input.hasAttribute('aria-valuenow'), false)
  strictEqual(input.getAttribute('aria-valuetext'), '1+')
})

test('removes aria-valuenow for incomplete decimals', () => {
  let input = createInput('.')

  syncSpinbuttonAria(input)

  strictEqual(input.hasAttribute('aria-valuenow'), false)
  strictEqual(input.getAttribute('aria-valuetext'), '.')
})

test('clears aria value attributes for empty input', () => {
  let input = createInput('')
  input.setAttribute('aria-valuenow', '1')
  input.setAttribute('aria-valuetext', '1')

  syncSpinbuttonAria(input)

  strictEqual(input.hasAttribute('aria-valuenow'), false)
  strictEqual(input.hasAttribute('aria-valuetext'), false)
})

test('switches from aria-valuetext to aria-valuenow after expression resolves', () => {
  let input = createInput('1/2')

  syncSpinbuttonAria(input)
  strictEqual(input.hasAttribute('aria-valuenow'), false)
  strictEqual(input.getAttribute('aria-valuetext'), '1/2')

  input.value = '0.5'
  syncSpinbuttonAria(input)

  strictEqual(input.getAttribute('aria-valuenow'), '0.5')
  strictEqual(input.hasAttribute('aria-valuetext'), false)
})

test('setSpinbuttonValue replaces stale text with the committed value', () => {
  let input = createInput('2')

  syncSpinbuttonAria(input)
  strictEqual(input.getAttribute('aria-valuenow'), '2')

  setSpinbuttonValue(input, 1)

  strictEqual(input.value, '1')
  strictEqual(input.getAttribute('aria-valuenow'), '1')
  strictEqual(input.hasAttribute('aria-valuetext'), false)
})
