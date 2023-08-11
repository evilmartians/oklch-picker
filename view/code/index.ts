import {
  forceP3,
  formatLch,
  isHexNotation,
  parseAnything
} from '../../lib/colors.js'
import { toggleInvalid, toggleVisibility } from '../../lib/dom.js'
import {
  current,
  setCurrentFromColor,
  valueToColor
} from '../../stores/current.js'
import {
  formats,
  type FormatsValue,
  isOutputFormat,
  srgbFormats
} from '../../stores/formats.js'
import { outputFormat, type OutputFormats } from '../../stores/settings.js'
import { visible } from '../../stores/visible.js'
import { toggleWarning } from '../field/index.js'

let lch = document.querySelector<HTMLDivElement>('.code.is-lch')!
let lchInput = lch.querySelector<HTMLInputElement>('input')!

let rgb = document.querySelector<HTMLDivElement>('.code.is-rgb')!
let rgbInput = rgb.querySelector<HTMLInputElement>('input')!

let notePaste = document.querySelector<HTMLDivElement>('.code_note.is-paste')!
let noteFigma = document.querySelector<HTMLDivElement>('.code_note.is-figma')!
let noteFallback = document.querySelector<HTMLDivElement>(
  '.code_note.is-fallback'
)!

let format = document.querySelector<HTMLSelectElement>('.code select')!

let prevValues = new Map<HTMLInputElement, string>()
let locked = new Map<HTMLInputElement, boolean>()

function setLch(): void {
  let value = current.get()
  let text = formatLch(valueToColor(value))
  prevValues.set(lchInput, text)
  lchInput.value = text
  toggleInvalid(lchInput, false)
}

function setRgb(): void {
  let { space } = visible.get()
  let type = outputFormat.get()
  let output = formats.get()[type]
  prevValues.set(rgbInput, output)
  rgbInput.value = output.replace(/^Figma P3 /, '')
  if (type === 'figmaP3') {
    toggleWarning(rgbInput, true)
    toggleVisibility(noteFigma, true)
    toggleVisibility(notePaste, false)
    toggleVisibility(noteFallback, false)
  } else {
    toggleWarning(rgbInput, false)
    toggleVisibility(noteFigma, false)
    let isFallback = space !== 'srgb' && srgbFormats.has(type)
    toggleVisibility(notePaste, !isFallback)
    toggleVisibility(noteFallback, isFallback)
  }
  toggleInvalid(rgbInput, false)
}

current.subscribe(() => {
  if (!locked.get(lchInput)) {
    setLch()
  }
})

visible.subscribe(() => {
  if (!locked.get(rgbInput)) {
    setRgb()
  }
})

function listenChanges(input: HTMLInputElement): void {
  function processChange(): void {
    let newValue = input.value.trim()

    if (newValue === prevValues.get(input)) return
    prevValues.set(input, newValue)

    let parsed = parseAnything(newValue)
    if (parsed) {
      toggleInvalid(input, false)
      if (outputFormat.get() === 'figmaP3' && input === rgbInput) {
        parsed = forceP3(parsed)
      }
      setCurrentFromColor(parsed)
    } else {
      toggleInvalid(input, true)
    }
  }

  input.addEventListener('change', processChange)
  input.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      input.blur()
    } else {
      processChange()
    }
  })
  input.addEventListener('focus', () => {
    locked.set(input, true)
  })
  input.addEventListener('blur', () => {
    locked.set(input, false)
    if (input === lchInput) {
      setLch()
    } else {
      if (outputFormat.get() !== 'figmaP3') {
        let value = input.value.trim()
        if (isHexNotation(value)) {
          outputFormat.set('hex/rgba')
        } else {
          let parsed = parseAnything(value)
          if (parsed && isOutputFormat(parsed.mode)) {
            outputFormat.set(parsed.mode)
          }
        }
      }
      setRgb()
    }
  })
}

listenChanges(lchInput)
listenChanges(rgbInput)

format.value = outputFormat.get()
outputFormat.listen(value => {
  format.value = value
  if (value === 'numbers') {
    rgb.ariaLabel = `OKLCH ${value}`
  } else {
    rgb.ariaLabel = `${value} CSS code`
  }
  setRgb()
})
format.addEventListener('change', () => {
  outputFormat.set(format.value as OutputFormats)
})

formats.subscribe(value => {
  for (let key in value) {
    let type = key as keyof FormatsValue
    if (type !== 'hex/rgba') {
      let option = format.querySelector<HTMLOptionElement>(`[value=${type}]`)!
      option.text = value[type]
    }
  }
})
