import {
  type AnyColor,
  Colordx,
  colordx,
  extend,
  getFormat,
  lchToLinearAndSrgbInto,
  lchToLinearSrgbInto,
  lchToRgbChannelsInto,
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

import { support } from '../stores/support.ts'

extend([p3Plugin, rec2020Plugin, lchPlugin, labPlugin])

// Scale matches the picker's build:
//   OKLCH build: l ∈ [0, 1],   c ∈ [0, ~0.4], h ∈ [0, 360)
//   LCH   build: l ∈ [0, 100], c ∈ [0, ~150], h ∈ [0, 360)
export interface Lch {
  alpha: number
  c: number
  h: number
  l: number
}

// Tolerance for setCurrent's round-trip: a 4-dp OKLCH can drift ~4.4e-4
// in linear sRGB; this accepts such drift as still-in-gamut.
const COLOR_SPACE_GAP = 0.0001
// Tighter tolerance for the pixel-render hot path; kills the CL-chart
// spike at L ≈ 0.
const RENDER_GAP = 1e-7

export const Space = {
  Out: 0,
  P3: 2,
  Rec2020: 3,
  sRGB: 1
} as const

export type Space = (typeof Space)[keyof typeof Space]

export function build(l: number, c: number, h: number, alpha = 1): Lch {
  return { alpha, c, h, l }
}

export function buildForCSS(
  l: number,
  c: number,
  h: number,
  alpha = 1
): string {
  return toNativeString(build(l, c, h, alpha))
}

function toDx(color: Lch): AnyColor {
  if (LCH) {
    return {
      alpha: color.alpha,
      c: color.c,
      colorSpace: 'lch' as const,
      h: color.h,
      l: color.l
    } as AnyColor
  }
  return color as AnyColor
}

// colordx's `toLch`/`toOklch` round to 4 dp by default. For lossless
// round-trips the picker needs the unrounded values — 15 dp is effectively
// raw at IEEE 754 double precision.
const RAW_PRECISION = 15

function toCanonical(dx: Colordx): Lch {
  let r = LCH ? dx.toLch(RAW_PRECISION) : dx.toOklch(RAW_PRECISION)
  return { alpha: r.alpha, c: r.c, h: r.h, l: r.l }
}

function preprocess(value: string): string {
  let v = value.trim().replace(/\s*;\s*$/, '')
  if (/^[\w-]+:\s*(#\w+|\w+\([^)]+\))$/.test(v)) {
    v = v.replace(/^[\w-]+:\s*/, '')
  }
  if (/^\s*[\d.]+%?\s+[\d.]+\s+[\d.]+\s*$/.test(v)) {
    v = `${COLOR_FN}(${v})`
  }
  return v
}

export function inputFormat(value: string): string | undefined {
  return getFormat(preprocess(value))
}

export function parseAnything(value: string): Lch | undefined {
  let cleaned = preprocess(value)
  let format = getFormat(cleaned)
  if (!format) return undefined
  let dx = colordx(cleaned)
  // Round per component (not via colordx's uniform precision arg) because
  // hue picks up atan2 noise above 4 dp while L/C stay clean to 6 dp.
  if (format === COLOR_FN) {
    let r = LCH ? dx.toLch(RAW_PRECISION) : dx.toOklch(RAW_PRECISION)
    let lcDp = LCH ? 4 : 6
    return {
      alpha: r.alpha,
      c: parseFloat(r.c.toFixed(lcDp)),
      h: parseFloat(r.h.toFixed(4)),
      l: parseFloat(r.l.toFixed(lcDp))
    }
  }
  return toCanonical(dx)
}

// Reinterpret sRGB bytes as Display-P3 channels (Figma's hex P3 mode).
export function interpretAsP3(color: Lch): Lch {
  let rgb = colordx(toDx(color)).toRgb()
  return toCanonical(
    colordx({
      alpha: rgb.alpha,
      b: rgb.b / 255,
      colorSpace: 'display-p3' as const,
      g: rgb.g / 255,
      r: rgb.r / 255
    })
  )
}

// OKLCH build → LCH coords; LCH build → OKLCH coords.
export function toOtherLch(color: Lch): Lch {
  let dx = colordx(toDx(color))
  let other = LCH ? dx.toOklch(RAW_PRECISION) : dx.toLch(RAW_PRECISION)
  return { alpha: other.alpha, c: other.c, h: other.h, l: other.l }
}

// sRGB-bound formats gamut-map first; wide-gamut formats preserve the original.
const PICKER_PRECISION = 2

function srgbDx(color: Lch): Colordx {
  return Colordx.toGamutSrgb(toDx(color))
}

export function toHex(color: Lch): string {
  return srgbDx(color).toHex()
}

export function toHex8(color: Lch): string {
  return srgbDx(color).toHex8()
}

export function toRgbString(color: Lch): string {
  return srgbDx(color).toRgbString({ legacy: true })
}

export function toHslString(color: Lch): string {
  return srgbDx(color).toHslString()
}

export function toOklabString(color: Lch): string {
  return colordx(toDx(color)).toOklabString(PICKER_PRECISION)
}

export function toOklchString(color: Lch): string {
  return colordx(toDx(color)).toOklchString(PICKER_PRECISION)
}

export function toLabString(color: Lch): string {
  return colordx(toDx(color)).toLabString()
}

export function toLchString(color: Lch): string {
  return colordx(toDx(color)).toLchString()
}

export function toP3String(color: Lch): string {
  return colordx(toDx(color)).toP3String()
}

export function toNativeString(color: Lch): string {
  return LCH ? toLchString(color) : toOklchString(color)
}

// 6 dp covers the picker's max stored precision; the toFixed/parseFloat
// dance strips FP noise from the LCH-mode L scaling (0.628 * 100 = 62.80…1).
function trimNoise(n: number): string {
  return String(parseFloat(n.toFixed(6)))
}

// Renders the store value verbatim so field, store, and URL stay in sync.
export function valueToNativeString(value: {
  a: number
  c: number
  h: number
  l: number
}): string {
  let l = LCH ? value.l * L_MAX_COLOR : value.l
  let head = `${COLOR_FN}(${trimNoise(l)} ${trimNoise(value.c)} ${trimNoise(value.h)}`
  return value.a < 100 ? `${head} / ${trimNoise(value.a)}%)` : `${head})`
}

// Canvas fillStyle hot path: needs sub-byte/sub-2dp precision so range
// strips render as smooth gradients, not banded steps. Picks the highest
// precision format the user's display supports.
let canvasFormatter: (color: Lch) => string = toRgbString
support.subscribe(value => {
  canvasFormatter = value.p3 ? toP3String : toRgbString
})
export function canvasFormat(color: Lch): string {
  return canvasFormatter(color)
}

// Hex of raw P3 channels — Figma's wide-gamut export, not sRGB-clamped.
export function toFigmaP3Hex(color: Lch): string {
  let p3 = colordx(toDx(color)).toP3()
  return `#${toHexByte(p3.r * 255)}${toHexByte(p3.g * 255)}${toHexByte(p3.b * 255)}${toHexByte(p3.alpha * 255)}`
}

export function toLinearSrgb(color: Lch): {
  alpha: number
  b: number
  g: number
  r: number
} {
  let buf = new Float64Array(3)
  if (LCH) {
    lchToLinearSrgbInto(buf, color.l, color.c, color.h)
  } else {
    oklchToLinearInto(buf, color.l, color.c, color.h)
  }
  return { alpha: color.alpha, b: buf[2], g: buf[1], r: buf[0] }
}

export function toSrgb(color: Lch): {
  alpha: number
  b: number
  g: number
  r: number
} {
  let raw = colordx(toDx(color))._rawRgb()
  return {
    alpha: raw.alpha,
    b: raw.b / 255,
    g: raw.g / 255,
    r: raw.r / 255
  }
}

// Hack to avoid ,999999 because of float bug implementation
export function clean(value: number, precision = 2): number {
  return (
    Math.round(parseFloat((value * 10 ** precision).toFixed(precision))) /
    10 ** precision
  )
}

export function isHexNotation(value: string): boolean {
  return /^#?([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
}

// Picker-specific tolerance lets rounded OKLCH values still classify as sRGB
// through setCurrent's round-trip.
export function inRGB(color: Lch): boolean {
  let raw = colordx(toDx(color))._rawRgb()
  let r = raw.r / 255
  let g = raw.g / 255
  let b = raw.b / 255
  return (
    r >= -COLOR_SPACE_GAP &&
    r <= 1 + COLOR_SPACE_GAP &&
    g >= -COLOR_SPACE_GAP &&
    g <= 1 + COLOR_SPACE_GAP &&
    b >= -COLOR_SPACE_GAP &&
    b <= 1 + COLOR_SPACE_GAP
  )
}

export function inP3(color: Lch): boolean {
  return inGamutP3(toDx(color))
}

export function inRec2020(color: Lch): boolean {
  return inGamutRec2020(toDx(color))
}

export function getSpace(color: Lch): Space {
  if (inRGB(color)) return Space.sRGB
  if (inP3(color)) return Space.P3
  if (inRec2020(color)) return Space.Rec2020
  return Space.Out
}

export type GetSpace = (color: Lch) => Space

export function generateGetSpace(
  showP3: boolean,
  showRec2020: boolean
): GetSpace {
  if (showP3 && showRec2020) {
    return color => {
      if (inRGB(color)) return Space.sRGB
      if (inP3(color)) return Space.P3
      if (inRec2020(color)) return Space.Rec2020
      return Space.Out
    }
  }
  if (showP3) {
    return color => {
      if (inRGB(color)) return Space.sRGB
      if (inP3(color)) return Space.P3
      return Space.Out
    }
  }
  if (showRec2020) {
    return color => {
      if (inRGB(color)) return Space.sRGB
      if (inRec2020(color)) return Space.Rec2020
      return Space.Out
    }
  }
  return color => (inRGB(color) ? Space.sRGB : Space.Out)
}

// CSS Color 4 chroma reduction; also snaps sub-byte fp noise (colordx 5.4.2+).
export function mapSrgb(color: Lch): Lch {
  return toCanonical(Colordx.toGamutSrgb(toDx(color)))
}

export type Pixel = [Space, number, number, number]
export type GetPixel = (x: number, y: number) => Pixel
export type GetColor = (x: number, y: number) => Lch

function inRenderGap(r: number, g: number, b: number): boolean {
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

let toLinearInto = LCH ? lchToLinearSrgbInto : oklchToLinearInto
let toLinearAndSrgbInto = LCH
  ? lchToLinearAndSrgbInto
  : oklchToLinearAndSrgbInto
let toSrgbInto = LCH ? lchToRgbChannelsInto : oklchToRgbChannelsInto

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
        toLinearInto(LIN_BUF, color.l, color.c, color.h)
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
        if (inRenderGap(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else if (inRenderGap(pr, pg, pb)) {
          pixel[0] = Space.P3
        } else {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inRenderGap(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
        return pixel
      }
    }
    return (x, y) => {
      let color = getColor(x, y)
      toLinearAndSrgbInto(LIN_BUF, SRGB_BUF, color.l, color.c, color.h)
      let lr = LIN_BUF[0]
      let lg = LIN_BUF[1]
      let lb = LIN_BUF[2]
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * SRGB_BUF[0]),
        Math.floor(255 * SRGB_BUF[1]),
        Math.floor(255 * SRGB_BUF[2])
      ]
      if (inRenderGap(lr, lg, lb)) {
        pixel[0] = Space.sRGB
      } else {
        linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
        if (inRenderGap(P3_BUF[0], P3_BUF[1], P3_BUF[2])) {
          pixel[0] = Space.P3
        } else {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inRenderGap(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
      }
      return pixel
    }
  }
  if (showP3) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        toLinearInto(LIN_BUF, color.l, color.c, color.h)
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
        if (inRenderGap(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else if (inRenderGap(pr, pg, pb)) {
          pixel[0] = Space.P3
        }
        return pixel
      }
    }
    return (x, y) => {
      let color = getColor(x, y)
      toLinearAndSrgbInto(LIN_BUF, SRGB_BUF, color.l, color.c, color.h)
      let lr = LIN_BUF[0]
      let lg = LIN_BUF[1]
      let lb = LIN_BUF[2]
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * SRGB_BUF[0]),
        Math.floor(255 * SRGB_BUF[1]),
        Math.floor(255 * SRGB_BUF[2])
      ]
      if (inRenderGap(lr, lg, lb)) {
        pixel[0] = Space.sRGB
      } else {
        linearToP3ChannelsInto(P3_BUF, lr, lg, lb)
        if (inRenderGap(P3_BUF[0], P3_BUF[1], P3_BUF[2])) {
          pixel[0] = Space.P3
        }
      }
      return pixel
    }
  }
  if (showRec2020) {
    if (p3Support) {
      return (x, y) => {
        let color = getColor(x, y)
        toLinearInto(LIN_BUF, color.l, color.c, color.h)
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
        if (inRenderGap(lr, lg, lb)) {
          pixel[0] = Space.sRGB
        } else {
          linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
          if (inRenderGap(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
            pixel[0] = Space.Rec2020
          }
        }
        return pixel
      }
    }
    return (x, y) => {
      let color = getColor(x, y)
      toLinearAndSrgbInto(LIN_BUF, SRGB_BUF, color.l, color.c, color.h)
      let lr = LIN_BUF[0]
      let lg = LIN_BUF[1]
      let lb = LIN_BUF[2]
      let pixel: Pixel = [
        Space.Out,
        Math.floor(255 * SRGB_BUF[0]),
        Math.floor(255 * SRGB_BUF[1]),
        Math.floor(255 * SRGB_BUF[2])
      ]
      if (inRenderGap(lr, lg, lb)) {
        pixel[0] = Space.sRGB
      } else {
        linearToRec2020ChannelsInto(REC_BUF, lr, lg, lb)
        if (inRenderGap(REC_BUF[0], REC_BUF[1], REC_BUF[2])) {
          pixel[0] = Space.Rec2020
        }
      }
      return pixel
    }
  }
  if (p3Support) {
    return (x, y) => {
      let color = getColor(x, y)
      toLinearInto(LIN_BUF, color.l, color.c, color.h)
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
      if (inRenderGap(lr, lg, lb)) {
        pixel[0] = Space.sRGB
      }
      return pixel
    }
  }
  return (x, y) => {
    let color = getColor(x, y)
    toSrgbInto(SRGB_BUF, color.l, color.c, color.h)
    let sr = SRGB_BUF[0]
    let sg = SRGB_BUF[1]
    let sb = SRGB_BUF[2]
    let pixel: Pixel = [
      Space.Out,
      Math.floor(255 * sr),
      Math.floor(255 * sg),
      Math.floor(255 * sb)
    ]
    if (inRenderGap(sr, sg, sb)) {
      pixel[0] = Space.sRGB
    }
    return pixel
  }
}
