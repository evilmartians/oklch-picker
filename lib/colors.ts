import {
  clampChroma,
  displayable,
  modeOklch,
  formatHex as originFormatHex,
  formatRgb as originFormatRgb,
  formatCss as originFormatCss,
  modeOklab,
  useMode,
  modeRgb,
  modeHsl,
  modeLch,
  modeLab,
  modeP3,
  parse as originParse
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

export let formatHex = originFormatHex as (color: Color) => string
export let formatRgb = originFormatRgb as (color: Color) => string
export let formatCss = originFormatCss as (color: Color) => string
export let parse = originParse as (value: string) => Color | undefined

export let oklch = useMode(modeOklch) as (color: Color) => LchColor
export let rgb = useMode(modeRgb) as (color: Color) => RgbColor
export let p3 = useMode(modeP3) as (color: Color) => RgbColor
useMode(modeOklab)
useMode(modeHsl)
useMode(modeLch)
useMode(modeLab)

export const inRGB = displayable

export function inP3(color: Color): boolean {
  let { r, b, g } = p3(color)
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
}

export function build(l: number, c: number, h: number, alpha = 1): LchColor {
  return { mode: 'oklch', l, c, h, alpha }
}

export let format: (color: Color) => string
if (hasP3Support) {
  format = color => formatCss(p3(color))
} else {
  format = formatHex
}

export function toRgb(color: Color): Color {
  return clampChroma(color, 'oklch')
}
