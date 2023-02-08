/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Color, displayable, Oklch, p3, rec2020, Rgb, rgb } from "culori";

import { LchValue } from "../lib/lch.js";

const isVisible = (color: Rgb): boolean => {
  let { r, b, g } = color
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
}

const inRGB = displayable

const inP3 = (color: Color) => isVisible(
  rgb(
    p3(color)
  )
)

const inRec2020 = (color: Color) => isVisible(
  rgb(
    rec2020(color)
  )
)

export function valueToColor(value: LchValue): Oklch {
  return {
    mode: 'oklch',
    l: (L_MAX * value.l) / 100,
    c: value.c,
    h: value.h,
    alpha: value.a / 100
  }
}

export function detectColorSpace(value: LchValue) {
  let color = valueToColor(value)

  if (inRGB(color)) {
    return 'srgb'
  }

  if (inP3(color)) {
    return 'p3'
  }

  return inRec2020(color) ? 'rec2020' : 'out'
}
