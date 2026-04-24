import './set-globals.ts'

import { strictEqual } from 'node:assert'
import { test } from 'node:test'

import { setSpinbuttonValue, syncSpinbuttonAria } from '../view/field/aria.ts'

document.head.innerHTML = '<meta name="viewport" content="width=device-width">'
document.body.innerHTML = `
  <div class="field">
    <kbd>l</kbd>
    <input
      class="field_input"
      pattern="^[0-9+\\/*.\\-]+$"
      role="spinbutton"
      value="50"
    >
    <button></button>
    <button></button>
  </div>
  <div class="field">
    <kbd>c</kbd>
    <input
      class="field_input"
      pattern="^[0-9+\\/*.\\-]+$"
      role="spinbutton"
      value="0.1"
    >
    <button></button>
    <button></button>
  </div>
`

await import('../view/field/index.ts')

function createInput(value: string): HTMLInputElement {
  let input = document.createElement('input')
  input.setAttribute('role', 'spinbutton')
  input.value = value
  return input
}

function getFieldInputs(): NodeListOf<HTMLInputElement> {
  let inputs = document.querySelectorAll<HTMLInputElement>('.field_input')

  inputs[0].value = '50'
  inputs[0].setSelectionRange(inputs[0].value.length, inputs[0].value.length)
  inputs[0].blur()
  inputs[1].value = '0.1'
  inputs[1].setSelectionRange(inputs[1].value.length, inputs[1].value.length)
  inputs[1].blur()

  return inputs
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

test('does not select field text on plain focus', () => {
  let inputs = getFieldInputs()
  let lightness = inputs[0]
  lightness.setSelectionRange(1, 1)
  lightness.focus()

  strictEqual(lightness.selectionStart, 1)
  strictEqual(lightness.selectionEnd, 1)
})

test('clears field text selection on blur', () => {
  let inputs = getFieldInputs()
  let lightness = inputs[0]
  lightness.focus()
  lightness.select()
  lightness.blur()

  strictEqual(lightness.selectionStart, lightness.value.length)
  strictEqual(lightness.selectionEnd, lightness.value.length)
})

test('selects field text on pointer focus', () => {
  let inputs = getFieldInputs()
  let chroma = inputs[1]
  chroma.setSelectionRange(1, 1)
  chroma.dispatchEvent(
    new window.MouseEvent('mousedown', { bubbles: true, button: 0 })
  )

  strictEqual(chroma.selectionStart, 0)
  strictEqual(chroma.selectionEnd, chroma.value.length)
})

test('keeps caret position on pointer interaction inside focused field', () => {
  let inputs = getFieldInputs()
  let chroma = inputs[1]
  chroma.focus()
  chroma.setSelectionRange(1, 1)
  chroma.dispatchEvent(
    new window.MouseEvent('mousedown', { bubbles: true, button: 0 })
  )

  strictEqual(chroma.selectionStart, 1)
  strictEqual(chroma.selectionEnd, 1)
})

test('selects field text on app hotkey focus', () => {
  let inputs = getFieldInputs()
  let lightness = inputs[0]
  lightness.setSelectionRange(1, 1)
  document.body.dispatchEvent(
    new window.KeyboardEvent('keyup', { bubbles: true, code: 'KeyL', key: 'l' })
  )

  strictEqual(document.activeElement, lightness)
  strictEqual(lightness.selectionStart, 0)
  strictEqual(lightness.selectionEnd, lightness.value.length)
})

test('selects field text on in-field hotkey focus', () => {
  let inputs = getFieldInputs()
  let lightness = inputs[0]
  let chroma = inputs[1]
  lightness.focus()
  lightness.select()
  chroma.setSelectionRange(1, 1)
  lightness.dispatchEvent(
    new window.KeyboardEvent('keydown', {
      bubbles: true,
      code: 'KeyC',
      key: 'c'
    })
  )

  strictEqual(document.activeElement, chroma)
  strictEqual(lightness.selectionStart, lightness.value.length)
  strictEqual(lightness.selectionEnd, lightness.value.length)
  strictEqual(chroma.selectionStart, 0)
  strictEqual(chroma.selectionEnd, chroma.value.length)
})
