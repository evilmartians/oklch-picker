import type { Color } from 'culori/fn'
import { computed } from 'nanostores'

import {
  fastFormat,
  formatRgb,
  inP3,
  inRec2020,
  inRGB,
  rgb,
  toRgb
} from '../lib/colors.js'
import { current, valueToColor } from './current.js'
import { support } from './support.js'

interface VisibleValue {
  color: Color
  fallback: string
  real: false | string
  space: 'out' | 'p3' | 'rec2020' | 'srgb'
}

export let visible = computed(
  [current, support],
  (value, { oklch, p3 }): VisibleValue => {
    let color: Color = valueToColor(value)
    if (inRGB(color)) {
      let rgbCss = formatRgb(rgb(color))
      if (!oklch) color = rgb(color)
      return {
        color,
        fallback: rgbCss,
        real: rgbCss,
        space: 'srgb'
      }
    } else {
      let rgbColor = toRgb(color)
      let fallback = formatRgb(rgbColor)
      if (inP3(color)) {
        return {
          color: p3 && oklch ? color : rgbColor,
          fallback,
          real: p3 ? fastFormat(color) : false,
          space: 'p3'
        }
      } else {
        return {
          color: rgbColor,
          fallback,
          real: false,
          space: inRec2020(color) ? 'rec2020' : 'out'
        }
      }
    }
  }
)
