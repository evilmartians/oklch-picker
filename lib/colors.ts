import {
  clampChroma,
  displayable,
  modeOklch,
  formatRgb,
  formatCss,
  useMode,
  modeRgb,
  modeP3
  // @ts-expect-error
} from 'culori/fn'

import { hasP3Support } from './screen.js'

export interface Color {
  mode: string
  alpha?: number
}

export interface RgbColor extends Color {
  r: number
  g: number
  b: number
}

export interface LchColor extends Color {
  l: number
  c: number
  h: number
}

let p3 = useMode(modeP3) as (color: Color) => RgbColor
useMode(modeRgb)
useMode(modeOklch)

export const inRGB = displayable

export function inP3(color: Color): boolean {
  let { r, b, g } = p3(color)
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
}

export function oklch(l: number, c: number, h: number, alpha = 1): LchColor {
  return { mode: 'oklch', l, c, h, alpha }
}

export let format: (color: Color) => string
if (hasP3Support) {
  format = color => formatCss(p3(color))
} else {
  format = formatRgb
}

export function mapToRgb(color: Color): string {
  return formatRgb(clampChroma(color, 'oklch'))
}
