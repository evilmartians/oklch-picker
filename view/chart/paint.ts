import {
  generateGetPixel,
  GetColor,
  Pixel,
  Space,
  build
} from '../../lib/colors.js'
import {
  generateGetSeparator,
  paintPixel,
  paintSeparatorPixel
} from '../../lib/paint.js'
import { support } from '../../stores/support.js'

function paintSeparator(
  pixels: ImageData,
  color: string,
  line: [number, number][] | undefined
): void {
  if (!line) return
  if (line.length > 0) {
    let prevY = line[0][1]!
    let prevX = 0
    for (let [x, y] of line) {
      if (x > prevX + 1) {
        prevY = line[0][1]!
      }
      if (Math.abs(prevY - y) < 10) {
        paintSeparatorPixel(pixels, x, y, color)
      }
      prevX = x
      prevY = y
    }
  }
}

function paint(
  width: number,
  height: number,
  section: number,
  xPos: number,
  hasGaps: boolean,
  block: number,
  showP3: boolean,
  showRec2020: boolean,
  p3: string,
  rec2020: string,
  getColor: GetColor
): ImageData {
  let getPixel = generateGetPixel(
    getColor,
    showP3,
    showRec2020,
    support.get().p3
  )
  let getSeparator = generateGetSeparator()
  let maxGap = 0.3 * height

  let pixels = new ImageData(width, height)
  for (let x = xPos; x <= section + xPos; x += 1) {
    let nextPixel: Pixel
    let pixel = getPixel(x, 0)
    let prevPixel = pixel
    for (let y = 0; y <= height; y += block) {
      nextPixel = getPixel(x, y + block)

      if (nextPixel[0] !== pixel[0]) {
        if (pixel[0] !== Space.Out) {
          paintPixel(pixels, x, y, pixel)
        }

        let prevIPixel = pixel
        for (let i = 1; i <= block; i++) {
          let iPixel = getPixel(x, y + i)
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
    paintSeparator(pixels, p3, getSeparator(Space.sRGB, Space.P3))
    paintSeparator(pixels, p3, getSeparator(Space.P3, Space.sRGB))
    paintSeparator(pixels, rec2020, getSeparator(Space.P3, Space.Rec2020))
    paintSeparator(pixels, rec2020, getSeparator(Space.Rec2020, Space.P3))
  } else if (!showRec2020 && showP3) {
    paintSeparator(pixels, p3, getSeparator(Space.sRGB, Space.P3))
    paintSeparator(pixels, p3, getSeparator(Space.P3, Space.sRGB))
  } else if (showRec2020 && !showP3) {
    paintSeparator(pixels, rec2020, getSeparator(Space.sRGB, Space.Rec2020))
    paintSeparator(pixels, rec2020, getSeparator(Space.Rec2020, Space.sRGB))
  }

  return pixels
}

export function paintCL(
  width: number,
  height: number,
  section: number,
  xPos: number,
  h: number,
  showP3: boolean,
  showRec2020: boolean,
  p3: string,
  rec2020: string
): ImageData {
  let lFactor = L_MAX / width
  let cFactor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / height

  return paint(
    width,
    height,
    section,
    xPos,
    false,
    6,
    showP3,
    showRec2020,
    p3,
    rec2020,
    (x, y) => {
      return build(x * lFactor, y * cFactor, h)
    }
  )
}

export function paintCH(
  width: number,
  height: number,
  section: number,
  xPos: number,
  l: number,
  showP3: boolean,
  showRec2020: boolean,
  p3: string,
  rec2020: string
): ImageData {
  let hFactor = H_MAX / width
  let cFactor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / height

  return paint(
    width,
    height,
    section,
    xPos,
    false,
    6,
    showP3,
    showRec2020,
    p3,
    rec2020,
    (x, y) => {
      return build(l, y * cFactor, x * hFactor)
    }
  )
}

export function paintLH(
  width: number,
  height: number,
  section: number,
  xPos: number,
  c: number,
  showP3: boolean,
  showRec2020: boolean,
  p3: string,
  rec2020: string
): ImageData {
  let hFactor = H_MAX / width
  let lFactor = L_MAX / height

  return paint(
    width,
    height,
    section,
    xPos,
    true,
    2,
    showP3,
    showRec2020,
    p3,
    rec2020,
    (x, y) => {
      return build(y * lFactor, c, x * hFactor)
    }
  )
}
