import type { Color, Oklch, Rgb, Lch } from 'culori/fn'
import {
  formatRgb as formatRgbFast,
  parse as originParse,
  clampChroma,
  displayable,
  modeRec2020,
  modeOklch,
  modeOklab,
  formatCss,
  useMode,
  modeRgb,
  modeHsl,
  modeLch,
  modeLab,
  modeP3
} from 'culori/fn'

import { support } from '../stores/support.js'

export type AnyLch = Lch | Oklch

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

export function build(l: number, c: number, h: number, alpha = 1): AnyLch {
  return { mode: COLOR_FN, l, c, h, alpha }
}

export let fastLchFormat: (c: AnyLch) => string = formatRgbFast

export let canvasFormat: (c: AnyLch) => string = formatRgbFast

export function fastFormat(color: Color): string {
  if (color.mode === COLOR_FN) {
    return fastLchFormat(color)
  } else {
    return formatRgbFast(color)
  }
}
function formatP3Css(c: Color): string {
  return formatCss(p3(c))
}

function fastFormatToLch(color: AnyLch): string {
  let { l, c, h, alpha } = color
  let a = alpha ?? 1
  return `${COLOR_FN}(${(100 * l) / L_MAX}% ${c} ${h} / ${100 * a})`
}

support.subscribe(value => {
  fastLchFormat = value.oklch ? fastFormatToLch : formatRgbFast
  canvasFormat = value.p3 ? formatP3Css : formatRgbFast
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

export function toRgb(color: Color): Rgb {
  return rgb(clampChroma(color, COLOR_FN))
}

export function formatRgb(color: Rgb): string {
  let r = Math.round(25500 * color.r) / 100
  let g = Math.round(25500 * color.g) / 100
  let b = Math.round(25500 * color.b) / 100
  if (typeof color.alpha !== 'undefined' && color.alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${color.alpha})`
  } else {
    return `rgb(${r}, ${g}, ${b})`
  }
}

export function formatLch(color: AnyLch): string {
  let { l, c, h, alpha } = color
  let postfix = ''
  if (typeof alpha !== 'undefined' && alpha < 1) {
    postfix = ` / ${toPercent(alpha)}`
  }
  return `${COLOR_FN}(${toPercent(l / L_MAX)} ${c} ${h}${postfix})`
}

// Hack to avoid ,999999 because of float bug implementation
export function clean(value: number): number {
  return Math.round(parseFloat((value * 10 ** 2).toFixed(2))) / 10 ** 2
}

export function toPercent(value: number): string {
  return `${clean(100 * value)}%`
}

export enum Space {
  sRGB,
  P3,
  Rec2020,
  Out
}

export function getSpace(color: Color): Space {
  if (inRGB(color)) {
    return Space.sRGB
  } else if (inP3(color)) {
    return Space.P3
  } else if (inRec2020(color)) {
    return Space.Rec2020
  } else {
    return Space.Out
  }
}

export type GetSpace = typeof getSpace

export function generateGetSpace(
  showP3: boolean,
  showRec2020: boolean
): GetSpace {
  if (showP3 && showRec2020) {
    return color => {
      if (inRGB(color)) {
        return Space.sRGB
      } else if (inP3(color)) {
        return Space.P3
      } else if (inRec2020(color)) {
        return Space.Rec2020
      } else {
        return Space.Out
      }
    }
  } else if (showP3 && !showRec2020) {
    return color => {
      if (inRGB(color)) {
        return Space.sRGB
      } else if (inP3(color)) {
        return Space.P3
      } else {
        return Space.Out
      }
    }
  } else if (!showP3 && showRec2020) {
    return color => {
      if (inRGB(color)) {
        return Space.sRGB
      } else if (inRec2020(color)) {
        return Space.P3
      } else {
        return Space.Out
      }
    }
  } else {
    return color => (inRGB(color) ? Space.sRGB : Space.Out)
  }
}

export type Pixel = [Space, number, number, number]

export interface GetPixel {
  (x: number, y: number): Pixel
}

export interface GetColor {
  (x: number, y: number): AnyLch
}

export function generateGetPixel(
  getColor: GetColor,
  showP3: boolean,
  showRec2020: boolean,
  p3Support: boolean
): GetPixel {
  if (showP3 && showRec2020) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        let colorP3 = p3(color)
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * colorP3.r),
          Math.floor(255 * colorP3.g),
          Math.floor(255 * colorP3.b)
        ]
        if (inRGB(color)) {
          pixel[0] = Space.sRGB
        } else if (
          colorP3.r >= 0 &&
          colorP3.r <= 1 &&
          colorP3.g >= 0 &&
          colorP3.g <= 1 &&
          colorP3.b >= 0 &&
          colorP3.b <= 1
        ) {
          pixel[0] = Space.P3
        } else if (inRec2020(color)) {
          pixel[0] = Space.Rec2020
        }
        return pixel
      }
    } else {
      return (x, y) => {
        let color = getColor(x, y)
        let colorSRGB = rgb(color)
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * colorSRGB.r),
          Math.floor(255 * colorSRGB.g),
          Math.floor(255 * colorSRGB.b)
        ]
        if (
          colorSRGB.r >= 0 &&
          colorSRGB.r <= 1 &&
          colorSRGB.g >= 0 &&
          colorSRGB.g <= 1 &&
          colorSRGB.b >= 0 &&
          colorSRGB.b <= 1
        ) {
          pixel[0] = Space.sRGB
        } else if (inP3(color)) {
          pixel[0] = Space.P3
        } else if (inRec2020(color)) {
          pixel[0] = Space.Rec2020
        }
        return pixel
      }
    }
  } else if (showP3 && !showRec2020) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        let colorP3 = p3(color)
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * colorP3.r),
          Math.floor(255 * colorP3.g),
          Math.floor(255 * colorP3.b)
        ]
        if (inRGB(color)) {
          pixel[0] = Space.sRGB
        } else if (
          colorP3.r >= 0 &&
          colorP3.r <= 1 &&
          colorP3.g >= 0 &&
          colorP3.g <= 1 &&
          colorP3.b >= 0 &&
          colorP3.b <= 1
        ) {
          pixel[0] = Space.P3
        }
        return pixel
      }
    } else {
      return (x, y) => {
        let color = getColor(x, y)
        let colorSRGB = rgb(color)
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * colorSRGB.r),
          Math.floor(255 * colorSRGB.g),
          Math.floor(255 * colorSRGB.b)
        ]
        if (
          colorSRGB.r >= 0 &&
          colorSRGB.r <= 1 &&
          colorSRGB.g >= 0 &&
          colorSRGB.g <= 1 &&
          colorSRGB.b >= 0 &&
          colorSRGB.b <= 1
        ) {
          pixel[0] = Space.sRGB
        } else if (inP3(color)) {
          pixel[0] = Space.P3
        }
        return pixel
      }
    }
  } else if (!showP3 && showRec2020) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        let colorP3 = p3(color)
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * colorP3.r),
          Math.floor(255 * colorP3.g),
          Math.floor(255 * colorP3.b)
        ]
        if (inRGB(color)) {
          pixel[0] = Space.sRGB
        } else if (inRec2020(color)) {
          pixel[0] = Space.Rec2020
        }
        return pixel
      }
    } else {
      return (x, y) => {
        let color = getColor(x, y)
        let colorSRGB = rgb(color)
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * colorSRGB.r),
          Math.floor(255 * colorSRGB.g),
          Math.floor(255 * colorSRGB.b)
        ]
        if (
          colorSRGB.r >= 0 &&
          colorSRGB.r <= 1 &&
          colorSRGB.g >= 0 &&
          colorSRGB.g <= 1 &&
          colorSRGB.b >= 0 &&
          colorSRGB.b <= 1
        ) {
          pixel[0] = Space.sRGB
        } else if (inRec2020(color)) {
          pixel[0] = Space.Rec2020
        }
        return pixel
      }
    }
  } else if (p3Support) {
    return (x, y) => {
      let color = getColor(x, y)
      let colorP3 = p3(color)
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * colorP3.r),
        Math.floor(255 * colorP3.g),
        Math.floor(255 * colorP3.b)
      ]
      if (inRGB(color)) {
        pixel[0] = Space.sRGB
      }
      return pixel
    }
  } else {
    return (x, y) => {
      let color = getColor(x, y)
      let colorSRGB = rgb(color)
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * colorSRGB.r),
        Math.floor(255 * colorSRGB.g),
        Math.floor(255 * colorSRGB.b)
      ]
      if (
        colorSRGB.r >= 0 &&
        colorSRGB.r <= 1 &&
        colorSRGB.g >= 0 &&
        colorSRGB.g <= 1 &&
        colorSRGB.b >= 0 &&
        colorSRGB.b <= 1
      ) {
        pixel[0] = Space.sRGB
      }
      return pixel
    }
  }
}
