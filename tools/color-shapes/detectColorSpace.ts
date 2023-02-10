/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Color, Lch, Oklch, p3, rec2020, Rgb } from "culori";
import { displayable } from "culori/fn";

import { LchValue } from "../../lib/lch.js";
import { GeneratorConfig } from "./generator-cfg.js";

export type Space = 'srgb' | 'p3' | 'rec2020'

const isVisible = (color: Rgb): boolean => {
  let { r, b, g } = color
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
}

const inRGB = displayable

const inP3 = (color: Color) => isVisible({
  ...p3(color),
  mode: 'rgb',
})

const inRec2020 = (color: Color) => isVisible({
  ...rec2020(color),
  mode: 'rgb'
})

export function makeSpaceDetector({ COLOR_FN, L_MAX }: GeneratorConfig) {

  function build(l: number, c: number, h: number, alpha = 1): Lch | Oklch {
    return { mode: COLOR_FN, l, c, h, alpha }
  }

  function valueToColor(value: LchValue) {
    let factor = COLOR_FN === 'lch' ? 100 : 1

    return build((L_MAX * value.l) / factor, value.c, value.h, value.a / 100)
  }

  return function (value: LchValue): Space | null {
    let color = valueToColor(value)

    if (inRGB(color)) return 'srgb'

    if (inP3(color)) return 'p3'

    return inRec2020(color) ? 'rec2020' : null
  }
}
