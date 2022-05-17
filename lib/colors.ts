import type {
  Color,
  Rgb as RgbColor,
  Lch as LchColor,
  Oklch as OklchColor
} from 'culori/fn'
import {
  clampChroma,
  formatRgb as fastFormatRgb,
  formatCss,
  displayable,
  modeRec2020,
  modeOklch,
  modeOklab,
  useMode,
  modeRgb,
  modeHsl,
  modeLch,
  modeLab,
  modeP3,
  parse as originParse
} from 'culori/fn'

import { support } from '../stores/support.js'

export type { Color, RgbColor, LchColor, OklchColor }

export { formatHex, formatCss, clampChroma } from 'culori/fn'

export let rec2020 = useMode(modeRec2020)
export let oklch = useMode(modeOklch)
export let rgb = useMode(modeRgb)
export let lch = useMode(modeLch)
export let p3 = useMode(modeP3)
useMode(modeOklab)
useMode(modeHsl)
useMode(modeLab)

export const inRGB = displayable

export function inP3(color: Color): boolean {
  let { r, b, g } = p3(color)
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
}

export function inRec2020(color: Color): boolean {
  let { r, b, g } = rec2020(color)
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
}

export function build(
  l: number,
  c: number,
  h: number,
  alpha = 1
): LchColor | OklchColor {
  return { mode: COLOR_FN, l, c, h, alpha }
}

export let format = fastFormatRgb

function formatP3Css(c: undefined): undefined
function formatP3Css(c: Color): string
function formatP3Css(c: undefined | string | Color): string | undefined
function formatP3Css(c: undefined | string | Color): string | undefined {
  let r = p3(c)
  return formatCss(r)
}

support.subscribe(hasP3 => {
  if (hasP3) {
    format = formatP3Css
  } else {
    format = fastFormatRgb
  }
})

export function parse(value: string): Color | undefined {
  if (value.startsWith('oklch(')) {
    value = value.replace(/^oklch\(/, 'color(--oklch ')
  }
  value = value.replace(/\s*;$/, '')
  if (/^[\w-]+:\s*(#\w+|\w+\([^)]+\))$/.test(value)) {
    value = value.replace(/^[\w-]+:\s*/, '')
  }
  return originParse(value)
}

export function toRgb(color: Color): RgbColor {
  return rgb(clampChroma(color, COLOR_FN))
}

export function formatRgb(color: RgbColor): string {
  let r = Math.round(25500 * color.r) / 100
  let g = Math.round(25500 * color.g) / 100
  let b = Math.round(25500 * color.b) / 100
  if (typeof color.alpha !== 'undefined' && color.alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${color.alpha})`
  } else {
    return `rgb(${r}, ${g}, ${b})`
  }
}

export function formatLch(color: LchColor | OklchColor): string {
  let { l, c, h, alpha } = color
  let postfix = ''
  if (typeof alpha !== 'undefined' && alpha < 1) {
    postfix = ` / ${toPercent(alpha)}`
  }
  return `${COLOR_FN}(${toPercent(l / L_MAX)} ${c} ${h}${postfix})`
}

// Hack to avoid ,999999 because of float bug implementation
function clean(value: number): number {
  return Math.round(parseFloat((value * 10 ** 2).toFixed(2))) / 10 ** 2
}

function toPercent(value: number): string {
  return `${clean(100 * value)}%`
}

export type GetAlpha = (color: Color) => number

export function generateGetAlpha(
  showP3: boolean,
  showRec2020: boolean
): GetAlpha {
  if (showRec2020 && showP3) {
    return color => {
      if (inRGB(color)) {
        return 1
      } else if (inP3(color)) {
        return 0.6
      } else {
        return 0.4
      }
    }
  } else if (showRec2020 && !showP3) {
    return color => (inRGB(color) ? 1 : 0.4)
  } else if (!showRec2020 && showP3) {
    return color => (inRGB(color) ? 1 : 0.6)
  } else {
    return () => 1
  }
}

export type IsVisible = (color: Color) => boolean

export function generateIsVisible(
  showP3: boolean,
  showRec2020: boolean
): IsVisible {
  if (showRec2020) {
    return inRec2020
  } else if (showP3) {
    return inP3
  } else {
    return inRGB
  }
}

export type Space = 'srgb' | 'p3' | 'rec2020' | 'out'

export function getSpace(color: Color): Space {
  if (inRGB(color)) {
    return 'srgb'
  } else if (inP3(color)) {
    return 'p3'
  } else if (inRec2020(color)) {
    return 'rec2020'
  } else {
    return 'out'
  }
}
