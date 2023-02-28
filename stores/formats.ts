import type { OutputFormats } from './settings.js'

import {
  formatHex8,
  formatHex,
  formatRgb,
  formatCss,
  Color,
  Oklab
} from 'culori/fn'
import { computed } from 'nanostores'

import {
  toPercent,
  inRGB,
  toRgb,
  clean,
  oklab,
  lch,
  lab,
  hsl,
  p3
} from '../lib/colors.js'
import { current, valueToColor } from './current.js'

function formatOklab(color: Oklab): string {
  let { l, a, b, alpha } = color
  if (typeof alpha !== 'undefined' && alpha < 1) {
    return `oklab(${toPercent(l)} ${clean(a)} ${clean(b)} / ${toPercent(alpha)}`
  } else {
    return `oklab(${toPercent(l)} ${clean(a)} ${clean(b)})`
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
    let color: Color = valueToColor(value)
    let rgbColor: Color = inRGB(color) ? color : toRgb(color)
    let hex = formatHex(rgbColor)
    let rgba = formatRgb(rgbColor)
    let hasAlpha = typeof color.alpha !== 'undefined' && color.alpha < 1
    return {
      'hex/rgba': hasAlpha ? rgba : hex,
      'hex': hasAlpha ? formatHex8(rgbColor) : hex,
      'rgb': rgba,
      'hsl': formatCss(cleanComponents(hsl(rgbColor))),
      'p3': formatCss(cleanComponents(p3(color))),
      'lch': formatCss(cleanComponents(lch(color))),
      'lab': formatCss(cleanComponents(lab(color))),
      'oklab': formatOklab(oklab(color))
    }
  }
)
