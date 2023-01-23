import { computed } from 'nanostores'
import { Color, formatHex, formatRgb } from 'culori'

import { current, valueToColor } from './current.js'
import { inRGB, toRgb } from '../lib/colors.js'

interface FormatsValue {
  auto: string
  hex: string
  rgba: string
}

export const formats = computed<FormatsValue, typeof current>(
  current,
  value => {
    let color: Color = valueToColor(value)
    let rgbColor: Color = inRGB(color) ? color : toRgb(color)
    let hex = formatHex(rgbColor)
    let rgba = formatRgb(rgbColor)
    return { auto: color.alpha && color.alpha < 1 ? rgba : hex, hex, rgba }
  }
)
