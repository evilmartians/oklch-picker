import type { Color } from 'culori/fn'
import { computed } from 'nanostores'

import {
  fastFormat,
  formatRgb,
  getSpace,
  rgb,
  Space,
  toRgb
} from '../lib/colors.ts'
import { current, valueToColor } from './current.ts'
import { support } from './support.ts'

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
    let space = getSpace(color)
    if (space === Space.sRGB) {
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
      if (space === Space.P3) {
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
          space: space === Space.Rec2020 ? 'rec2020' : 'out'
        }
      }
    }
  }
)
