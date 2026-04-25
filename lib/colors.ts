import {
  type AnyColor,
  Colordx,
  extend,
  lchToLinearAndSrgbInto,
  lchToLinearSrgbInto,
  oklchToLinearAndSrgbInto,
  oklchToLinearInto,
  oklchToRgbChannelsInto,
  toHexByte
} from '@colordx/core'
import labPlugin from '@colordx/core/plugins/lab'
import lchPlugin from '@colordx/core/plugins/lch'
import p3Plugin, {
  inGamutP3,
  linearToP3ChannelsInto
} from '@colordx/core/plugins/p3'
import rec2020Plugin, {
  inGamutRec2020,
  linearToRec2020ChannelsInto
} from '@colordx/core/plugins/rec2020'
import {
  type Color,
  formatCss,
  formatRgb as formatRgbFast,
  type Lch,
  type Lrgb,
  modeLch,
  modeOklch,
  modeP3,
  modeRgb,
  modeXyz65,
  type Oklch,
  parse as originParse,
  type P3,
  type Rec2020,
  type Rgb,
  useMode
} from 'culori/fn'

import { support } from '../stores/support.ts'

export type { Rgb } from 'culori/fn'

extend([p3Plugin, rec2020Plugin, lchPlugin, labPlugin])

export type AnyLch = Lch | Oklch
export type AnyRgb = Lrgb | P3 | Rec2020 | Rgb

export let oklch = useMode(modeOklch)
let xyz65 = useMode(modeXyz65)
export let rgb = useMode(modeRgb)
export let lch = useMode(modeLch)
let p3 = useMode(modeP3)

const COLOR_SPACE_GAP = 0.0001
const RENDER_GAP = 1e-7

// Dirty fix of https://github.com/Evercoder/culori/issues/249
export function inRGB(color: Color): boolean {
  let check = rgb(color)
  return (
    check.r >= -COLOR_SPACE_GAP &&
    check.r <= 1 + COLOR_SPACE_GAP &&
    check.g >= -COLOR_SPACE_GAP &&
    check.g <= 1 + COLOR_SPACE_GAP &&
    check.b >= -COLOR_SPACE_GAP &&
    check.b <= 1 + COLOR_SPACE_GAP
  )
}
// colordx discriminates CIE LCH from OKLCH by `colorSpace: 'lch'`.
// Culori-shape lch objects don't have it — add at the boundary.
function asAnyColor(color: Color): AnyColor {
  if (color.mode === 'lch') {
    return { ...color, colorSpace: 'lch' } as unknown as AnyColor
  }
  return color as AnyColor
}

export function inP3(color: Color): boolean {
  return inGamutP3(asAnyColor(color))
}
export function inRec2020(color: Color): boolean {
  return inGamutRec2020(asAnyColor(color))
}

export function build(l: number, c: number, h: number, alpha = 1): AnyLch {
  return { alpha, c, h, l, mode: COLOR_FN }
}

export function buildForCSS(
  l: number,
  c: number,
  h: number,
  alpha = 1
): string {
  if (support.get().p3) {
    return formatLch(build(l, c, h, alpha))
  } else {
    return formatRgb(toRgb(build(l, c, h, alpha)))
  }
}

export let toTarget: (color: Color) => AnyLch
if (LCH) {
  toTarget = lch
} else {
  toTarget = oklch
}

export let canvasFormat: (c: AnyLch) => string = formatRgbFast

export function fastFormat(color: Color): string {
  if (color.mode === COLOR_FN) {
    return formatLch(color)
  } else {
    return formatRgbFast(color)
  }
}
function formatP3Css(c: Color): string {
  return formatCss(p3(c))
}

support.subscribe(value => {
  canvasFormat = value.p3 ? formatP3Css : formatRgbFast
})

export function parse(value: string): Color | undefined {
  return originParse(value.trim())
}

export function parseAnything(value: string): Color | undefined {
  value = value.replace(/\s*;\s*$/, '')
  if (/^[\w-]+:\s*(#\w+|\w+\([^)]+\))$/.test(value)) {
    value = value.replace(/^[\w-]+:\s*/, '')
  }
  if (/^\s*[\d.]+%?\s+[\d.]+\s+[\d.]+\s*$/.test(value)) {
    value = `${COLOR_FN}(${value})`
  }
  return parse(value)
}

export function forceP3(color: Color): P3 {
  return { ...rgb(color), mode: 'p3' }
}

// Wrap colordx RGB bytes (0..255) in culori's rgb shape (channels in 0..1).
// Drop when view/chart + worker consume colordx-native color objects.
export function toCuloriRgb(c: {
  alpha: number
  b: number
  g: number
  r: number
}): Rgb {
  return {
    alpha: c.alpha,
    b: c.b / 255,
    g: c.g / 255,
    mode: 'rgb',
    r: c.r / 255
  }
}

export function toRgb(color: Color): Rgb {
  return toCuloriRgb(Colordx.toGamutSrgb(asAnyColor(color))._rawRgb())
}

export function toRgbClipped(color: Color): Rgb {
  let c = rgb(color)
  return {
    alpha: c.alpha,
    b: Math.min(1, Math.max(0, c.b)),
    g: Math.min(1, Math.max(0, c.g)),
    mode: 'rgb',
    r: Math.min(1, Math.max(0, c.r))
  }
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
  let { alpha, c, h, l } = color
  let postfix = ''
  if (typeof alpha !== 'undefined' && alpha < 1) {
    postfix = ` / ${clean(100 * alpha)}%`
  }
  return `${COLOR_FN}(${clean(l / L_MAX, 4)} ${c} ${h}${postfix})`
}

// Hack to avoid ,999999 because of float bug implementation
export function clean(value: number, precision = 2): number {
  return (
    Math.round(parseFloat((value * 10 ** precision).toFixed(precision))) /
    10 ** precision
  )
}

// Wrapper over colordx's toHex8 for culori-shaped inputs (rgb channels in [0, 1]).
// Drop once parseAnything returns colordx-native color objects.
export function toHex8(color: Color): string {
  let c = rgb(color)
  return `#${toHexByte(c.r * 255)}${toHexByte(c.g * 255)}${toHexByte(c.b * 255)}${toHexByte((c.alpha ?? 1) * 255)}`
}

export function isHexNotation(value: string): boolean {
  return /^#?([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
}

export type Space = number

// Hack for enum without enum
// oxlint-disable-next-line typescript/no-redeclare
export let Space = {
  Out: 3,
  P3: 1,
  Rec2020: 2,
  sRGB: 0
}

let getProxyColor: (color: Color) => Color
if (LCH) {
  getProxyColor = xyz65
} else {
  getProxyColor = rgb
}

export function getSpace(color: Color): Space {
  if (inRGB(getProxyColor(color))) {
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
      if (inRGB(getProxyColor(color))) {
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
      if (inRGB(getProxyColor(color))) {
        return Space.sRGB
      } else if (inP3(color)) {
        return Space.P3
      } else {
        return Space.Out
      }
    }
  } else if (!showP3 && showRec2020) {
    return color => {
      if (inRGB(getProxyColor(color))) {
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

function inGamutEps(r: number, g: number, b: number): boolean {
  return (
    r >= -RENDER_GAP &&
    r <= 1 + RENDER_GAP &&
    g >= -RENDER_GAP &&
    g <= 1 + RENDER_GAP &&
    b >= -RENDER_GAP &&
    b <= 1 + RENDER_GAP
  )
}

const LIN_BUF = new Float64Array(3)
const SRGB_BUF = new Float64Array(3)
const P3_BUF = new Float64Array(3)
const REC_BUF = new Float64Array(3)

export function generateGetPixel(
  getColor: GetColor,
  showP3: boolean,
  showRec2020: boolean,
  p3Support: boolean
): GetPixel {
  if (LCH) {
    if (p3Support && (showP3 || showRec2020)) {
      return (x, y) => {
        let color = getColor(x, y)
        lchToLinearSrgbInto(LIN_BUF, color.l, color.c, color.h ?? 0)
        let lr = LIN_BUF[0]
        let lg = LIN_BUF[1]
        let lb = LIN_BUF[2]
        linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
        let pr = P3_BUF[0]
        let pg = P3_BUF[1]
        let pb = P3_BUF[2]
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * pr),
          Math.floor(255 * pg),
          Math.floor(255 * pb)
        ]
        if (inGamutEps(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else if (showP3 && inGamutEps(pr, pg, pb)) {
          pixel[0] = Space.P3
        } else if (showRec2020) {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inGamutEps(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
        return pixel
      }
    }
    return (x, y) => {
      let color = getColor(x, y)
      lchToLinearAndSrgbInto(
        LIN_BUF,
        SRGB_BUF,
        color.l,
        color.c,
        color.h ?? 0
      )
      let lr = LIN_BUF[0]
      let lg = LIN_BUF[1]
      let lb = LIN_BUF[2]
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * SRGB_BUF[0]),
        Math.floor(255 * SRGB_BUF[1]),
        Math.floor(255 * SRGB_BUF[2])
      ]
      if (inGamutEps(lr, lg, lb)) {
        pixel[0] = Space.sRGB
      } else if (showP3) {
        linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
        if (inGamutEps(P3_BUF[0], P3_BUF[1], P3_BUF[2])) {
          pixel[0] = Space.P3
        } else if (showRec2020) {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inGamutEps(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
      } else if (showRec2020) {
        linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
        if (inGamutEps(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
          pixel[0] = Space.Rec2020
        }
      }
      return pixel
    }
  }

  // OKLCH mode: fast low-level channel functions from colordx
  if (showP3 && showRec2020) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        oklchToLinearInto(LIN_BUF, color.l, color.c, color.h ?? 0)
        let lr = LIN_BUF[0]
        let lg = LIN_BUF[1]
        let lb = LIN_BUF[2]
        linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
        let pr = P3_BUF[0]
        let pg = P3_BUF[1]
        let pb = P3_BUF[2]
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * pr),
          Math.floor(255 * pg),
          Math.floor(255 * pb)
        ]
        if (inGamutEps(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else if (inGamutEps(pr, pg, pb)) {
          pixel[0] = Space.P3
        } else {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inGamutEps(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
        return pixel
      }
    } else {
      return (x, y) => {
        let color = getColor(x, y)
        oklchToLinearAndSrgbInto(
          LIN_BUF,
          SRGB_BUF,
          color.l,
          color.c,
          color.h ?? 0
        )
        let lr = LIN_BUF[0]
        let lg = LIN_BUF[1]
        let lb = LIN_BUF[2]
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * SRGB_BUF[0]),
          Math.floor(255 * SRGB_BUF[1]),
          Math.floor(255 * SRGB_BUF[2])
        ]
        if (inGamutEps(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else {
          linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
          if (inGamutEps(P3_BUF[0], P3_BUF[1], P3_BUF[2])) {
            pixel[0] = Space.P3
          } else {
            linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
            if (inGamutEps(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
              pixel[0] = Space.Rec2020
            }
          }
        }
        return pixel
      }
    }
  } else if (showP3 && !showRec2020) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        oklchToLinearInto(LIN_BUF, color.l, color.c, color.h ?? 0)
        let lr = LIN_BUF[0]
        let lg = LIN_BUF[1]
        let lb = LIN_BUF[2]
        linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
        let pr = P3_BUF[0]
        let pg = P3_BUF[1]
        let pb = P3_BUF[2]
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * pr),
          Math.floor(255 * pg),
          Math.floor(255 * pb)
        ]
        if (inGamutEps(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else if (inGamutEps(pr, pg, pb)) {
          pixel[0] = Space.P3
        }
        return pixel
      }
    } else {
      return (x, y) => {
        let color = getColor(x, y)
        oklchToLinearAndSrgbInto(
          LIN_BUF,
          SRGB_BUF,
          color.l,
          color.c,
          color.h ?? 0
        )
        let lr = LIN_BUF[0]
        let lg = LIN_BUF[1]
        let lb = LIN_BUF[2]
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * SRGB_BUF[0]),
          Math.floor(255 * SRGB_BUF[1]),
          Math.floor(255 * SRGB_BUF[2])
        ]
        if (inGamutEps(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else {
          linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
          if (inGamutEps(P3_BUF[0], P3_BUF[1], P3_BUF[2])) {
            pixel[0] = Space.P3
          }
        }
        return pixel
      }
    }
  } else if (!showP3 && showRec2020) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        oklchToLinearInto(LIN_BUF, color.l, color.c, color.h ?? 0)
        let lr = LIN_BUF[0]
        let lg = LIN_BUF[1]
        let lb = LIN_BUF[2]
        linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * P3_BUF[0]),
          Math.floor(255 * P3_BUF[1]),
          Math.floor(255 * P3_BUF[2])
        ]
        if (inGamutEps(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inGamutEps(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
        return pixel
      }
    } else {
      return (x, y) => {
        let color = getColor(x, y)
        oklchToLinearAndSrgbInto(
          LIN_BUF,
          SRGB_BUF,
          color.l,
          color.c,
          color.h ?? 0
        )
        let lr = LIN_BUF[0]
        let lg = LIN_BUF[1]
        let lb = LIN_BUF[2]
        let pixel: Pixel = [
          Space.Out,
          Math.floor(255 * SRGB_BUF[0]),
          Math.floor(255 * SRGB_BUF[1]),
          Math.floor(255 * SRGB_BUF[2])
        ]
        if (inGamutEps(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inGamutEps(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
        return pixel
      }
    }
  } else if (p3Support) {
    return (x, y) => {
      let color = getColor(x, y)
      oklchToLinearInto(LIN_BUF, color.l, color.c, color.h ?? 0)
      let lr = LIN_BUF[0]
      let lg = LIN_BUF[1]
      let lb = LIN_BUF[2]
      linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * P3_BUF[0]),
        Math.floor(255 * P3_BUF[1]),
        Math.floor(255 * P3_BUF[2])
      ]
      if (inGamutEps(lr, lg, lb)) {
        pixel[0] = Space.sRGB
      }
      return pixel
    }
  } else {
    return (x, y) => {
      let color = getColor(x, y)
      oklchToRgbChannelsInto(SRGB_BUF, color.l, color.c, color.h ?? 0)
      let sr = SRGB_BUF[0]
      let sg = SRGB_BUF[1]
      let sb = SRGB_BUF[2]
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * sr),
        Math.floor(255 * sg),
        Math.floor(255 * sb)
      ]
      if (inGamutEps(sr, sg, sb)) {
        pixel[0] = Space.sRGB
      }
      return pixel
    }
  }
}
