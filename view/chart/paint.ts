import {
  generateGetPixel,
  GetColor,
  Pixel,
  Space,
  build
} from '../../lib/colors.js'
import {
  generateGetSeparator,
  getBorders,
  paintPixel
} from '../../lib/paint.js'
import { getCleanCtx, setScale } from '../../lib/canvas.js'
import { showRec2020, showP3 } from '../../stores/settings.js'
import { getQuickScale } from '../../stores/benchmark.js'
import { support } from '../../stores/support.js'

function paintSeparator(
  ctx: CanvasRenderingContext2D,
  color: string,
  line: [number, number][] | undefined
): void {
  if (!line) return
  ctx.strokeStyle = color
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

function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasGaps: boolean,
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
  let getSeparator = generateGetSeparator()
  let maxGap = 0.3 * height

  let pixels = ctx.createImageData(width, height)
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
  ctx.putImageData(pixels, 0, 0)

  let [p3, rec2020] = getBorders()
  if (showP3.get() && showRec2020.get()) {
    paintSeparator(ctx, p3, getSeparator(Space.sRGB, Space.P3))
    paintSeparator(ctx, p3, getSeparator(Space.P3, Space.sRGB))
    paintSeparator(ctx, rec2020, getSeparator(Space.P3, Space.Rec2020))
    paintSeparator(ctx, rec2020, getSeparator(Space.Rec2020, Space.P3))
  } else if (!showRec2020.get() && showP3.get()) {
    paintSeparator(ctx, p3, getSeparator(Space.sRGB, Space.P3))
    paintSeparator(ctx, p3, getSeparator(Space.P3, Space.sRGB))
  } else if (showRec2020.get() && !showP3.get()) {
    paintSeparator(ctx, rec2020, getSeparator(Space.sRGB, Space.Rec2020))
    paintSeparator(ctx, rec2020, getSeparator(Space.Rec2020, Space.sRGB))
  }
}

export function paintCL(
  canvas: HTMLCanvasElement,
  h: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('h', isFull))
  let ctx = getCleanCtx(canvas)

  let lFactor = L_MAX / width
  let cFactor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / height

  paint(ctx, width, height, false, 6, isFull, (x, y) => {
    return build(x * lFactor, y * cFactor, h)
  })
}

export function paintCH(
  canvas: HTMLCanvasElement,
  l: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('l', isFull))
  let ctx = getCleanCtx(canvas)

  let hFactor = H_MAX / width
  let cFactor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / height

  paint(ctx, width, height, false, 6, isFull, (x, y) => {
    return build(l, y * cFactor, x * hFactor)
  })
}

export function paintLH(
  canvas: HTMLCanvasElement,
  c: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('c', isFull))
  let ctx = getCleanCtx(canvas)

  let hFactor = H_MAX / width
  let lFactor = L_MAX / height

  paint(ctx, width, height, true, 2, isFull, (x, y) => {
    return build(y * lFactor, c, x * hFactor)
  })
}
