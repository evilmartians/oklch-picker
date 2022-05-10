import { computed } from 'nanostores'

import {
  inRec2020,
  formatRgb,
  format,
  Space,
  inRGB,
  toRgb,
  inP3,
  rgb
} from '../lib/colors.js'
import { current, valueToColor } from './current.js'
import { support } from './support.js'

interface VisibleValue {
  space: Space
  fallback: string
  real: string | false
}

export let visible = computed<VisibleValue, [typeof current, typeof support]>(
  [current, support],
  (value, hasP3) => {
    let color = valueToColor(value)
    if (inRGB(color)) {
      let rgbCss = formatRgb(rgb(color))
      return {
        space: 'srgb',
        fallback: rgbCss,
        real: rgbCss
      }
    } else {
      let fallback = formatRgb(toRgb(color))
      if (inP3(color)) {
        return {
          space: 'p3',
          fallback,
          real: hasP3 ? format(color) : false
        }
      } else {
        return {
          space: inRec2020(color) ? 'rec2020' : 'out',
          fallback,
          real: false
        }
      }
    }
  }
)
