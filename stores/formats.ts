import { computed } from 'nanostores'

import {
  clean,
  toFigmaP3Hex,
  toHex,
  toHex8,
  toHslString,
  toLabString,
  toLchString,
  toLinearSrgb,
  toOklabString,
  toP3String,
  toRgbString
} from '../lib/colors.ts'
import { current, valueToColor } from './current.ts'
import type { OutputFormats } from './settings.ts'

function formatLrgb(color: {
  alpha: number
  b: number
  g: number
  r: number
}): string {
  return `Linear RGB vec(${clean(color.r, 5)}, ${clean(color.g, 5)}, ${clean(color.b, 5)}, ${clean(color.alpha, 5)})`
}

function formatNumbers(
  l: number,
  c: number,
  h: number,
  alpha: number
): string {
  let prefix = `${clean(l)}, ${clean(c)}, ${clean(h)}`
  return alpha < 1 ? `${prefix}, ${clean(alpha)}` : prefix
}

export type FormatsValue = Record<OutputFormats, string>

export let srgbFormats = new Set<OutputFormats>([
  'hex',
  'hex/rgba',
  'hsl',
  'rgb'
])

export let formats = computed(current, value => {
  let color = valueToColor(value)
  let hasAlpha = color.alpha < 1
  return {
    'figmaP3': 'Figma P3 ' + toFigmaP3Hex(color),
    'hex': hasAlpha ? toHex8(color) : toHex(color),
    'hex/rgba': hasAlpha ? toRgbString(color) : toHex(color),
    'hsl': toHslString(color),
    'lab': toLabString(color),
    'lch': toLchString(color),
    'lrgb': formatLrgb(toLinearSrgb(color)),
    'numbers': formatNumbers(color.l, color.c, color.h, color.alpha),
    'oklab': toOklabString(color),
    'p3': toP3String(color),
    'rgb': toRgbString(color)
  } as FormatsValue
})

export const OUTPUT_FORMATS = Object.keys(formats.get())

export function isOutputFormat(format: string): format is OutputFormats {
  return OUTPUT_FORMATS.includes(format)
}
