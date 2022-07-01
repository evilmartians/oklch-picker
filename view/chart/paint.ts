import {
  generateGetPixel,
  GetColor,
  Pixel,
  Space,
  build
} from '../../lib/colors.js'
import { getCleanCtx, setScale } from '../../lib/canvas.js'
import { showRec2020, showP3 } from '../../stores/settings.js'
import { getQuickScale } from '../../stores/benchmark.js'
import { support } from '../../stores/support.js'

type Separators = Partial<Record<`${Space}${Space}`, [number, number][]>>

function getLine(
  separators: Separators,
  prevSpace: Space,
  nextSpace: Space
): [number, number][] {
  let line = separators[`${prevSpace}${nextSpace}`]
  if (line) {
    return line
  } else {
    return (separators[`${prevSpace}${nextSpace}`] = [])
  }
}

function paintSeparator(
  ctx: CanvasRenderingContext2D,
  bg: string,
  line: [number, number][] | undefined
): void {
  if (!line) return
  ctx.strokeStyle = bg
  ctx.lineWidth = 1
  if (line.length > 0) {
    let prevY = line[0][1]!
    let prevX = 0
    ctx.beginPath()
    for (let [x, y] of line) {
      if (x > prevX + 1) {
        ctx.stroke()
        ctx.beginPath()
      }
      if (Math.abs(prevY - y) < 10) {
        ctx.lineTo(x, y)
      }
      prevX = x
      prevY = y
    }
  }
  ctx.stroke()
}

function paintPixel(
  pixels: ImageData,
  x: number,
  y: number,
  pixel: Pixel
): void {
  let pos = 4 * ((pixels.height - y) * pixels.width + x)
  pixels.data[pos] = pixel[1]
  pixels.data[pos + 1] = pixel[2]
  pixels.data[pos + 2] = pixel[3]
  pixels.data[pos + 3] = 255
}

function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasGaps: boolean,
  bg: string,
  block: number,
  isFull: boolean,
  getColor: GetColor
): void {
  let getPixel = generateGetPixel(
    getColor,
    showP3.get(),
    showRec2020.get(),
    support.get().p3
  )

  let separators: Separators = {}
  let pixels = ctx.createImageData(width, height)

  let maxGap = 0.3 * height

  for (let x = 0; x <= width; x += 1) {
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
            getLine(separators, prevIPixel[0], iPixel[0]).push([
              x,
              height - y - i
            ])
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
  ctx.putImageData(pixels, 0, 0)

  if (isFull) {
    if (showP3.get() && showRec2020.get()) {
      paintSeparator(ctx, bg, getLine(separators, Space.sRGB, Space.P3))
      paintSeparator(ctx, bg, getLine(separators, Space.P3, Space.sRGB))
      paintSeparator(ctx, bg, getLine(separators, Space.P3, Space.Rec2020))
      paintSeparator(ctx, bg, getLine(separators, Space.Rec2020, Space.P3))
    } else if (!showRec2020.get() && showP3.get()) {
      paintSeparator(ctx, bg, getLine(separators, Space.sRGB, Space.P3))
      paintSeparator(ctx, bg, getLine(separators, Space.P3, Space.sRGB))
    } else if (showRec2020.get() && !showP3.get()) {
      paintSeparator(ctx, bg, getLine(separators, Space.sRGB, Space.Rec2020))
      paintSeparator(ctx, bg, getLine(separators, Space.Rec2020, Space.sRGB))
    }
  }
}

export function paintCL(
  canvas: HTMLCanvasElement,
  bg: string,
  h: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('h', isFull))
  let ctx = getCleanCtx(canvas)

  let lFactor = L_MAX / width
  let cFactor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / height

  paint(ctx, width, height, false, bg, 6, isFull, (x, y) => {
    return build(x * lFactor, y * cFactor, h)
  })
}

export function paintCH(
  canvas: HTMLCanvasElement,
  bg: string,
  l: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('l', isFull))
  let ctx = getCleanCtx(canvas)

  let hFactor = H_MAX / width
  let cFactor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / height

  paint(ctx, width, height, false, bg, 6, isFull, (x, y) => {
    return build(l, y * cFactor, x * hFactor)
  })
}

export function paintLH(
  canvas: HTMLCanvasElement,
  bg: string,
  c: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('c', isFull))
  let ctx = getCleanCtx(canvas)

  let hFactor = H_MAX / width
  let lFactor = L_MAX / height

  paint(ctx, width, height, true, bg, 2, isFull, (x, y) => {
    return build(y * lFactor, c, x * hFactor)
  })
}
