import './set-globals.ts'

import { type Color, inGamut, modeP3, modeRgb, useMode } from 'culori/fn'

import { build, generateGetPixel, type GetColor, type Pixel, Space } from '../lib/colors.ts'

const WIDTH = 500
const HEIGHT = 500
const RUNS = 5
const H_MAX = 360
const C_MAX = 0.4

let culoriRgb = useMode(modeRgb)
let culoriP3 = useMode(modeP3)
let culoriInP3 = inGamut('p3')
let culoriInRec2020 = inGamut('rec2020')

function culoriInRGB(color: Color): boolean {
  let check = culoriRgb(color)
  let eps = 0.0001
  return (
    check.r >= -eps && check.r <= 1 + eps &&
    check.g >= -eps && check.g <= 1 + eps &&
    check.b >= -eps && check.b <= 1 + eps
  )
}

function culoriGenerateGetPixel(
  getColor: GetColor,
  showP3: boolean,
  showRec2020: boolean,
  p3Support: boolean
): (x: number, y: number) => Pixel {
  return (x, y) => {
    let color = getColor(x, y)
    let proxyColor = culoriRgb(color)
    let displayColor = p3Support && (showP3 || showRec2020) ? culoriP3(proxyColor) : culoriRgb(proxyColor)
    let pixel: Pixel = [
      Space.Out,
      Math.floor(255 * displayColor.r),
      Math.floor(255 * displayColor.g),
      Math.floor(255 * displayColor.b)
    ]
    if (culoriInRGB(proxyColor)) {
      pixel[0] = Space.sRGB
    } else if (showP3 && culoriInP3(proxyColor)) {
      pixel[0] = Space.P3
    } else if (showRec2020 && culoriInRec2020(proxyColor)) {
      pixel[0] = Space.Rec2020
    }
    return pixel
  }
}

function paintWith(
  getPixelFn: (getColor: GetColor, showP3: boolean, showRec2020: boolean, p3Support: boolean) => (x: number, y: number) => Pixel,
  showP3: boolean,
  showRec2020: boolean,
  p3Support: boolean
): void {
  let hFactor = H_MAX / WIDTH
  let cFactor = C_MAX / HEIGHT
  let getPixel = getPixelFn(
    (x, y) => build(0.6, y * cFactor, x * hFactor),
    showP3,
    showRec2020,
    p3Support
  )
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      getPixel(x, y)
    }
  }
}

function bench(label: string, fn: () => void): void {
  fn() // warmup

  let times: number[] = []
  for (let i = 0; i < RUNS; i++) {
    let start = performance.now()
    fn()
    times.push(performance.now() - start)
  }

  let avg = times.reduce((a, b) => a + b, 0) / times.length
  let min = Math.min(...times)
  let pixels = WIDTH * HEIGHT
  process.stdout.write(
    `${label}: avg ${avg.toFixed(1)}ms  min ${min.toFixed(1)}ms  (${((pixels / avg) / 1000).toFixed(0)}k px/ms)\n`
  )
}

process.stdout.write('\nculori (baseline):\n')
bench('  sRGB only         ', () => { paintWith(culoriGenerateGetPixel, false, false, false); })
bench('  P3 + Rec2020 sRGB ', () => { paintWith(culoriGenerateGetPixel, true, true, false); })
bench('  P3 + Rec2020 P3   ', () => { paintWith(culoriGenerateGetPixel, true, true, true); })

process.stdout.write('\ncolordx fast path:\n')
bench('  sRGB only         ', () => { paintWith(generateGetPixel, false, false, false); })
bench('  P3 + Rec2020 sRGB ', () => { paintWith(generateGetPixel, true, true, false); })
bench('  P3 + Rec2020 P3   ', () => { paintWith(generateGetPixel, true, true, true); })
