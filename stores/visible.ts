import { computed } from 'nanostores'

import {
  type AnyLch,
  type AnyRgb,
  fastFormat,
  formatRgb,
  getSpace,
  rgb,
  Space,
  toRgb,
  toRgbClipped
} from '../lib/colors.ts'
import { current, valueToColor } from './current.ts'
import { support } from './support.ts'

interface VisibleValue {
  color: AnyLch | AnyRgb
  fallback: string
  fallbackBrowsers: string
  real: false | string
  space: 'out' | 'p3' | 'rec2020' | 'srgb'
}

export let visible = computed(
  [current, support],
  (value, { p3, rec2020 }): VisibleValue => {
    let color = valueToColor(value)
    let space = getSpace(color)
    if (space === Space.sRGB) {
      let rgbCss = formatRgb(rgb(color))
      return {
        color,
        fallback: rgbCss,
        fallbackBrowsers: rgbCss,
        real: rgbCss,
        space: 'srgb'
      }
    } else {
      let rgbColor = toRgb(color)
      let fallback = formatRgb(rgbColor)
      let fallbackBrowsers = formatRgb(toRgbClipped(color))
      if (space === Space.P3) {
        return {
          color: p3 ? color : rgbColor,
          fallback,
          fallbackBrowsers,
          real: p3 ? fastFormat(color) : false,
          space: 'p3'
        }
      } else if (space === Space.Rec2020) {
        return {
          color: rec2020 ? color : rgbColor,
          fallback,
          fallbackBrowsers,
          real: rec2020 ? fastFormat(color) : false,
          space: 'rec2020'
        }
      } else {
        return {
          color: rgbColor,
          fallback,
          fallbackBrowsers,
          real: false,
          space: 'out'
        }
      }
    }
  }
)
