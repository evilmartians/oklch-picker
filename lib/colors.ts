import {
  clampChroma,
  displayable,
  modeOklch,
  formatRgb as fastFormatRgb,
  formatHex as originFormatHex,
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
export let formatCss = originFormatCss as (color: Color) => string

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
  format = fastFormatRgb
}

export function parse(value: string): Color | undefined {
  if (value.startsWith('oklch(')) {
    value = value.replace(/^oklch\(/, 'color(--oklch ')
  }
  return originParse(value)
}

export function toRgb(color: Color): RgbColor {
  return rgb(clampChroma(color, 'oklch'))
}

export function formatRgb(color: RgbColor): string {
  let r = Math.round(25500 * color.r) / 100
  let g = Math.round(25500 * color.g) / 100
  let b = Math.round(25500 * color.b) / 100
  if (color.alpha && color.alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${color.alpha})`
  } else {
    return `rgb(${r}, ${g}, ${b})`
  }
}

export function formatLch(color: LchColor): string {
  let { l, c, h, alpha } = color
  let postfix = alpha && alpha < 1 ? ` / ${100 * alpha}%` : ''
  return `oklch(${100 * l}% ${c} ${h}${postfix})`
}
