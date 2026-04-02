import './set-globals.ts'

import { modeLrgb, modeP3, modeRec2020, modeRgb, useMode } from 'culori/fn'
import { deepStrictEqual, ok } from 'node:assert'
import { test } from 'node:test'

import {
  build,
  generateGetPixel,
  type GetColor,
  type Pixel,
  Space
} from '../lib/colors.ts'

// Culori baseline — uses linear channel checks to match colordx's gamut logic
let culoriRgb = useMode(modeRgb)
let culoriLrgb = useMode(modeLrgb)
let culoriP3 = useMode(modeP3)
let culoriRec2020 = useMode(modeRec2020)

const EPS = 0.0001
function inLinearGamut(r: number, g: number, b: number): boolean {
  return r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS
}

function culoriGenerateGetPixel(
  getColor: GetColor,
  showP3: boolean,
  showRec2020: boolean,
  p3Support: boolean
): (x: number, y: number) => Pixel {
  return (x, y) => {
    let color = getColor(x, y)
    let lrgb = culoriLrgb(color)
    let p3 = culoriP3(color)
    let rec2020 = culoriRec2020(color)
    let displayColor =
      p3Support && (showP3 || showRec2020) ? p3 : culoriRgb(color)
    let pixel: Pixel = [
      Space.Out,
      Math.floor(255 * displayColor.r),
      Math.floor(255 * displayColor.g),
      Math.floor(255 * displayColor.b)
    ]
    if (inLinearGamut(lrgb.r, lrgb.g, lrgb.b)) {
      pixel[0] = Space.sRGB
    } else if (showP3 && inLinearGamut(p3.r, p3.g, p3.b)) {
      pixel[0] = Space.P3
    } else if (showRec2020 && inLinearGamut(rec2020.r, rec2020.g, rec2020.b)) {
      pixel[0] = Space.Rec2020
    }
    return pixel
  }
}

const GRID = 50
const H_MAX = 360
const C_MAX = 0.4
const BOUNDARY_SKIP = 0.0001

function isNearBoundary(l: number, c: number, h: number): boolean {
  let color = build(l, c, h)
  let lrgb = culoriLrgb(color)
  let p3Color = culoriP3(color)
  let rec2020Color = culoriRec2020(color)
  for (let v of [
    lrgb.r, lrgb.g, lrgb.b,
    p3Color.r, p3Color.g, p3Color.b,
    rec2020Color.r, rec2020Color.g, rec2020Color.b
  ]) {
    if (Math.abs(v) < BOUNDARY_SKIP || Math.abs(v - 1) < BOUNDARY_SKIP) {
      return true
    }
  }
  return false
}

function runParityTest(
  label: string,
  showP3: boolean,
  showRec2020: boolean,
  p3Support: boolean
): void {
  test(`parity: ${label}`, () => {
    let getColor: GetColor = (x, y) =>
      build(
        0.1 + 0.8 * (y / GRID), // L: 0.1 – 0.9
        C_MAX * (x / GRID), // C: 0 – 0.4
        (H_MAX * ((x + y) % GRID)) / GRID // H: varied
      )

    let colordxPixel = generateGetPixel(
      getColor,
      showP3,
      showRec2020,
      p3Support
    )
    let culoriPixel = culoriGenerateGetPixel(
      getColor,
      showP3,
      showRec2020,
      p3Support
    )

    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        let l = 0.1 + 0.8 * (y / GRID)
        let c = C_MAX * (x / GRID)
        let h = (H_MAX * ((x + y) % GRID)) / GRID

        let [cSpace, cR, cG, cB] = colordxPixel(x, y)
        let [oSpace, oR, oG, oB] = culoriPixel(x, y)

        // Space must match for non-boundary colors
        if (!isNearBoundary(l, c, h)) {
          deepStrictEqual(
            cSpace,
            oSpace,
            `space mismatch at L=${l.toFixed(3)} C=${c.toFixed(3)} H=${h.toFixed(1)}: colordx=${cSpace} culori=${oSpace}`
          )
        }

        // RGB channels within ±1 (floating point precision between conversion paths)
        ok(
          Math.abs(cR - oR) <= 1,
          `R mismatch at L=${l.toFixed(3)} C=${c.toFixed(3)} H=${h.toFixed(1)}: colordx=${cR} culori=${oR}`
        )
        ok(
          Math.abs(cG - oG) <= 1,
          `G mismatch at L=${l.toFixed(3)} C=${c.toFixed(3)} H=${h.toFixed(1)}: colordx=${cG} culori=${oG}`
        )
        ok(
          Math.abs(cB - oB) <= 1,
          `B mismatch at L=${l.toFixed(3)} C=${c.toFixed(3)} H=${h.toFixed(1)}: colordx=${cB} culori=${oB}`
        )
      }
    }
  })
}

runParityTest('sRGB only', false, false, false)
runParityTest('P3+Rec2020 sRGB', true, true, false)
runParityTest('P3+Rec2020 P3', true, true, true)
runParityTest('P3 only sRGB', true, false, false)
runParityTest('P3 only P3', true, false, true)
runParityTest('Rec2020 only sRGB', false, true, false)
runParityTest('Rec2020 only P3', false, true, true)
