import type { Color } from 'culori/fn'

import { computed } from 'nanostores'

import {
  fastFormat,
  inRec2020,
  formatRgb,
  inRGB,
  toRgb,
  inP3,
  rgb
} from '../lib/colors.js'
import { current, valueToColor } from './current.js'
import { support } from './support.js'

interface VisibleValue {
  space: 'srgb' | 'p3' | 'rec2020' | 'out'
  color: Color
  real: string | false
  fallback: string
}

export let visible = computed<VisibleValue, [typeof current, typeof support]>(
  [current, support],
  (value, { p3, oklch }) => {
    let color: Color = valueToColor(value)
    if (inRGB(color)) {
      let rgbCss = formatRgb(rgb(color))
      if (!oklch) color = rgb(color)
      return {
        space: 'srgb',
        color,
        real: rgbCss,
        fallback: rgbCss
      }
    } else {
      let rgbColor = toRgb(color)
      let fallback = formatRgb(rgbColor)
      if (inP3(color)) {
        return {
          space: 'p3',
          color: p3 && oklch ? color : rgbColor,
          real: p3 ? fastFormat(color) : false,
          fallback
        }
      } else {
        return {
          space: inRec2020(color) ? 'rec2020' : 'out',
          color: rgbColor,
          real: false,
          fallback
        }
      }
    }
  }
)
