import {
  type Color,
  formatCss,
  formatHex,
  formatHex8,
  formatRgb,
  type Oklab,
  type P3
} from 'culori/fn'
import { computed } from 'nanostores'

import type { AnyLch } from '../lib/colors.js'
import {
  clean,
  hsl,
  inRGB,
  lab,
  lch,
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

function toByte(float: number): number {
  return Math.round(255 * float)
}

function figmaP3(color: P3): string {
  return `${toByte(color.r)} ${toByte(color.g)} ${toByte(color.b)}`
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

function cleanComponents<Obj extends {}>(color: Obj): Obj {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = {}
  for (let key in color) {
    let value = color[key]
    if (typeof value === 'number' && key !== 'alpha') {
      result[key] = clean(value)
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
      'figmaP3': 'Figma P3 ' + figmaP3(p3(color)),
      'hex': hasAlpha ? formatHex8(rgbColor) : hex,
      'hex/rgba': hasAlpha ? rgba : hex,
      'hsl': formatCss(cleanComponents(hsl(rgbColor))),
      'lab': formatCss(cleanComponents(lab(color))),
      'lch': formatCss(cleanComponents(lch(color))),
      'numbers': toNumbers(color),
      'oklab': formatOklab(oklab(color)),
      'p3': formatCss(cleanComponents(p3(color))),
      'rgb': rgba
    }
  }
)
