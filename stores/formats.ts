import { colordx, oklchToLinear, toHexByte } from '@colordx/core'
import { computed } from 'nanostores'

import { clean } from '../lib/colors.ts'
import { current, valueToColor } from './current.ts'
import type { OutputFormats } from './settings.ts'

function formatVec(r: number, g: number, b: number, alpha: number): string {
  return `vec(${clean(r, 5)}, ${clean(g, 5)}, ${clean(b, 5)}, ${clean(alpha, 5)})`
}

function toNumbers(l: number, c: number, h: number, alpha: number): string {
  let prefix = `${clean(l)}, ${clean(c)}, ${clean(h)}`
  if (alpha < 1) return `${prefix}, ${clean(alpha)}`
  return prefix
}

// Hex of the raw P3 channels (Figma's wide-gamut export format).
// Channels are 0..1 (P3Color scale); colordx's toHex8 only covers sRGB.
function figmaP3Hex(
  color: { r: number; g: number; b: number; alpha: number }
): string {
  return `#${toHexByte(color.r * 255)}${toHexByte(color.g * 255)}${toHexByte(color.b * 255)}${toHexByte(color.alpha * 255)}`
}

export type FormatsValue = Record<OutputFormats, string>

export let srgbFormats = new Set<OutputFormats>([
  'hex',
  'hex/rgba',
  'hsl',
  'rgb'
])

export let formats = computed(current, value => {
  let oklch = valueToColor(value)
  let l = oklch.l
  let c = oklch.c
  let h = oklch.h ?? 0
  let alpha = oklch.alpha ?? 1
  let hasAlpha = alpha < 1

  let dx =
    COLOR_FN === 'lch'
      ? colordx({ alpha, c, colorSpace: 'lch', h, l })
      : colordx({ alpha, c, h, l })
  let mapped = dx.mapSrgb()
  let rgbString = mapped.toRgbString({ legacy: true })
  let [lr, lg, lb] = oklchToLinear(l, c, h)

  return {
    'figmaP3': 'Figma P3 ' + figmaP3Hex(dx.toP3()),
    'hex': hasAlpha ? mapped.toHex8() : mapped.toHex(),
    'hex/rgba': hasAlpha ? rgbString : mapped.toHex(),
    'hsl': mapped.toHslString(),
    'lab': dx.toLabString(),
    'lch': dx.toLchString(),
    'lrgb': 'Linear RGB ' + formatVec(lr, lg, lb, alpha),
    'numbers': toNumbers(l, c, h, alpha),
    'oklab': dx.toOklabString(2),
    'p3': dx.toP3String(),
    'rgb': rgbString
  } as FormatsValue
})

export const OUTPUT_FORMATS = Object.keys(formats.get())

export function isOutputFormat(format: string): format is OutputFormats {
  return OUTPUT_FORMATS.includes(format)
}
