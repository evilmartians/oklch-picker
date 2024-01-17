import {
  build,
  generateGetPixel,
  type GetColor,
  type Pixel,
  type Rgb,
  Space
} from '../../lib/colors.js'
import { generateGetSeparator, paintPixel } from '../../lib/paint.js'
import { support } from '../../stores/support.js'

function separate(
  pixels: ImageData,
  color: Rgb,
  line: [number, number][] | undefined
): void {
  if (!line) return
  if (line.length > 0) {
    let prevY = line[0][1]
    let prevX = 0
    for (let [x, y] of line) {
      if (x > prevX + 1) {
        prevY = line[0][1]!
      }
      if (Math.abs(prevY - y) < 10) {
        let pos = 4 * (y * pixels.width + x)
        pixels.data[pos] = Math.round(color.r * 255)
        pixels.data[pos + 1] = Math.round(color.g * 255)
        pixels.data[pos + 2] = Math.round(color.b * 255)
        pixels.data[pos + 3] = Math.round((color.alpha ?? 1) * 255)
      }
      prevX = x
      prevY = y
    }
  }
}

function paint(
  height: number,
  from: number,
  to: number,
  hasGaps: boolean,
  block: number,
  showP3: boolean,
  showRec2020: boolean,
  borderP3: Rgb,
  borderRec2020: Rgb,
  getColor: GetColor
): ImageData {
  let getPixel = generateGetPixel(
    getColor,
    showP3,
    showRec2020,
    support.get().p3
  )
  let getSeparator = generateGetSeparator()
  let maxGap = 0.42 * height

  let pixels = new ImageData(to - from + 1, height)
  for (let x = 0; x <= to - from; x += 1) {
    let nextPixel: Pixel
    let pixel = getPixel(from + x, 0)
    let prevPixel = pixel
    for (let y = 0; y <= height; y += block) {
      nextPixel = getPixel(from + x, y + block)

      if (nextPixel[0] !== pixel[0]) {
        if (pixel[0] !== Space.Out) {
          paintPixel(pixels, x, y, pixel)
        }

        let prevIPixel = pixel
        for (let i = 1; i <= block; i++) {
          let iPixel = getPixel(from + x, y + i)
          if (iPixel[0] !== prevIPixel[0]) {
            getSeparator(prevIPixel[0], iPixel[0]).push([x, height - y - i])
          }
          if (iPixel[0] !== Space.Out) {
            paintPixel(pixels, x, y + i, iPixel)
          }
          prevIPixel = iPixel
        }
      } else if (pixel[0] !== Space.Out) {
        for (let i = 0; i < block; i++) {
          paintPixel(pixels, x, y + i, pixel)
        }
      } else if (hasGaps) {
        if (prevPixel[0] !== Space.Out && y > maxGap) {
          break
        }
      } else {
        break
      }

      prevPixel = pixel
      pixel = nextPixel
    }
  }

  if (showP3 && showRec2020) {
    separate(pixels, borderP3, getSeparator(Space.sRGB, Space.P3))
    separate(pixels, borderP3, getSeparator(Space.P3, Space.sRGB))
    separate(pixels, borderRec2020, getSeparator(Space.P3, Space.Rec2020))
    separate(pixels, borderRec2020, getSeparator(Space.Rec2020, Space.P3))
  } else if (!showRec2020 && showP3) {
    separate(pixels, borderP3, getSeparator(Space.sRGB, Space.P3))
    separate(pixels, borderP3, getSeparator(Space.P3, Space.sRGB))
  } else if (showRec2020 && !showP3) {
    separate(pixels, borderRec2020, getSeparator(Space.sRGB, Space.Rec2020))
    separate(pixels, borderRec2020, getSeparator(Space.Rec2020, Space.sRGB))
  }

  return pixels
}

export function paintCL(
  width: number,
  height: number,
  from: number,
  to: number,
  h: number,
  showP3: boolean,
  showRec2020: boolean,
  borderP3: Rgb,
  borderRec2020: Rgb
): ImageData {
  let lFactor = L_MAX / width
  let cFactor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / height

  return paint(
    height,
    from,
    to,
    false,
    6,
    showP3,
    showRec2020,
    borderP3,
    borderRec2020,
    (x, y) => build(x * lFactor, y * cFactor, h)
  )
}

export function paintCH(
  width: number,
  height: number,
  from: number,
  to: number,
  l: number,
  showP3: boolean,
  showRec2020: boolean,
  borderP3: Rgb,
  borderRec2020: Rgb
): ImageData {
  let hFactor = H_MAX / width
  let cFactor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / height

  return paint(
    height,
    from,
    to,
    false,
    6,
    showP3,
    showRec2020,
    borderP3,
    borderRec2020,
    (x, y) => build(l, y * cFactor, x * hFactor)
  )
}

export function paintLH(
  width: number,
  height: number,
  from: number,
  to: number,
  c: number,
  showP3: boolean,
  showRec2020: boolean,
  borderP3: Rgb,
  borderRec2020: Rgb
): ImageData {
  let hFactor = H_MAX / width
  let lFactor = L_MAX / height

  return paint(
    height,
    from,
    to,
    true,
    2,
    showP3,
    showRec2020,
    borderP3,
    borderRec2020,
    (x, y) => build(y * lFactor, c, x * hFactor)
  )
}
