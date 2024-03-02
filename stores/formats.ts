import {
  type Color,
  formatCss,
  formatHex,
  formatHex8,
  formatRgb,
  type Oklab,
  serializeHex8
} from 'culori/fn'
import { computed } from 'nanostores'

import {
  type AnyLch,
  type AnyRgb,
  clean,
  hsl,
  inRGB,
  lab,
  lch,
  lrgb,
  oklab,
  p3,
  toPercent,
  toRgb
} from '../lib/colors.js'
import { current, valueToColor } from './current.js'
import type { OutputFormats } from './settings.js'

function formatOklab(color: Oklab): string {
  let { a, alpha, b, l } = color
  let postfix = ''
  if (typeof alpha !== 'undefined' && alpha < 1) {
    postfix = ` / ${clean(alpha)}`
  }
  return `oklab(${toPercent(l)} ${clean(a)} ${clean(b)}${postfix})`
}

function formatVec(color: AnyRgb): string {
  let { alpha, b, g, r } = color
  let a = alpha ?? 1
  return `vec(${clean(r, 5)}, ${clean(g, 5)}, ${clean(b, 5)}, ${clean(a, 5)})`
}

function toNumbers(color: AnyLch): string {
  let { alpha, c, h, l } = color
  let prefix = `${clean(l)}, ${clean(c)}, ${clean(h ?? 0)}`
  if (typeof alpha !== 'undefined' && alpha < 1) {
    return `${prefix}, ${clean(alpha)}`
  } else {
    return prefix
  }
}

function cleanComponents<Obj extends {}>(color: Obj, precision?: number): Obj {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = {}
  for (let key in color) {
    let value = color[key]
    if (typeof value === 'number' && key !== 'alpha') {
      result[key] = clean(value, precision)
    } else {
      result[key] = color[key]
    }
  }
  return result
}

export type FormatsValue = Record<OutputFormats, string>

export const srgbFormats = new Set<OutputFormats>([
  'hex/rgba',
  'hex',
  'rgb',
  'hsl'
])

export const formats = computed<FormatsValue, typeof current>(
  current,
  value => {
    let color: AnyLch = valueToColor(value)
    let rgbColor: Color = inRGB(color) ? color : toRgb(color)
    let hex = formatHex(rgbColor)
    let rgba = formatRgb(rgbColor)
    let hasAlpha = typeof color.alpha !== 'undefined' && color.alpha < 1
    return {
      'figmaP3': 'Figma P3 ' + serializeHex8(p3(color)),
      'hex': hasAlpha ? formatHex8(rgbColor) : hex,
      'hex/rgba': hasAlpha ? rgba : hex,
      'hsl': formatCss(cleanComponents(hsl(rgbColor))),
      'lab': formatCss(cleanComponents(lab(color))),
      'lch': formatCss(cleanComponents(lch(color))),
      'lrgb': 'Linear RGB ' + formatVec(lrgb(color)),
      'numbers': toNumbers(color),
      'oklab': formatOklab(oklab(color)),
      'p3': formatCss(cleanComponents(p3(color), 4)),
      'rgb': rgba
    }
  }
)

export const OUTPUT_FORMATS = Object.keys(formats.get())

export function isOutputFormat(format: string): format is OutputFormats {
  return OUTPUT_FORMATS.includes(format)
}
