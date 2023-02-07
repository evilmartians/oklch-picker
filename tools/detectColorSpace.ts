import { Color, formatRgb, rgb } from "culori";

import { fastFormat, inP3, inRec2020, inRGB, toRgb } from "../lib/colors.js";
import { LchValue, valueToColor } from "../stores/current.js";
import { VisibleValue } from "../stores/visible.js";

export function detectColorSpace(value: LchValue): VisibleValue {
  let color: Color = valueToColor(value)

  if (inRGB(color)) {
    let rgbCss = formatRgb(rgb(color))

    return {
      space: 'srgb',
      color,
      real: rgbCss,
      fallback: rgbCss
    } as const
  }

  let rgbColor = toRgb(color)
  let fallback = formatRgb(rgbColor)
  if (inP3(color)) {
    return {
      space: 'p3',
      color,
      real: fastFormat(color),
      fallback
    } as const
  }

  return {
    space: inRec2020(color) ? 'rec2020' : 'out',
    color: rgbColor,
    real: false,
    fallback
  } as const
}
