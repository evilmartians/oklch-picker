import {
  formatHex,
  formatRgb,
  formatCss,
  Color,
  oklab,
  Oklab,
  lch,
  lab,
  hsl,
  p3
} from 'culori'
import { computed } from 'nanostores'

import { inRGB, toRgb, clean, toPercent } from '../lib/colors.js'
import { current, valueToColor } from './current.js'
import { OutputFormats } from './settings.js'

function formatOklab(color: Oklab): string {
  let { l, a, b, alpha } = color
  return `oklab(${toPercent(l)} ${clean(a)} ${clean(b)} / ${
    100 * (alpha ?? 1)
  })`
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

export const formats = computed<FormatsValue, typeof current>(
  current,
  value => {
    let color: Color = valueToColor(value)
    let rgbColor: Color = inRGB(color) ? color : toRgb(color)
    let hex = formatHex(rgbColor)
    let rgba = formatRgb(rgbColor)
    return {
      auto: color.alpha && color.alpha < 1 ? rgba : hex,
      hex,
      rgb: rgba,
      hsl: formatCss(cleanComponents(hsl(rgbColor))),
      p3: formatCss(cleanComponents(p3(color))),
      lch: formatCss(cleanComponents(lch(color))),
      lab: formatCss(cleanComponents(lab(color))),
      oklab: formatOklab(oklab(color))
    }
  }
)
