import { Rgb, Color } from 'culori'

import {
  generateFastGetSpace,
  AnyLch,
  Space,
  build,
  rgb,
  p3
} from '../../lib/colors.js'
import { getCleanCtx, setScale } from '../../lib/canvas.js'
import { showRec2020, showP3 } from '../../stores/settings.js'
import { getQuickScale } from '../../stores/benchmark.js'
import { support } from '../../stores/support.js'

interface GetColor {
  (x: number, y: number): AnyLch
}

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

function paintPixel(pixels: ImageData, x: number, y: number, rgba: Rgb): void {
  let pos = 4 * ((pixels.height - y) * pixels.width + x)
  pixels.data[pos] = Math.floor(255 * rgba.r)
  pixels.data[pos + 1] = Math.floor(255 * rgba.g)
  pixels.data[pos + 2] = Math.floor(255 * rgba.b)
  pixels.data[pos + 3] = 255
}

function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasGaps: boolean,
  bg: string,
  isFull: boolean,
  getColor: GetColor
): void {
  let getSpace = generateFastGetSpace(showP3.get(), showRec2020.get())

  let separators: Separators = {}
  let pixels = ctx.createImageData(width, height)
  let toPixel = (support.get().p3 ? p3 : rgb) as (color: Color) => Rgb

  let maxGap = 0.3 * height

  for (let x = 0; x <= width; x += 1) {
    let prevSpace = getSpace(getColor(x, 0))
    for (let y = 0; y <= height; y += 1) {
      let color = getColor(x, y)
      let space = getSpace(color)
      if (space !== Space.Out) {
        if (prevSpace !== space) {
          getLine(separators, prevSpace, space).push([x, height - y])
          prevSpace = space
        }
        paintPixel(pixels, x, y, toPixel(color))
      } else if (hasGaps) {
        if (prevSpace !== Space.Out && y > maxGap) {
          break
        }
      } else {
        break
      }
    }
  }
  ctx.putImageData(pixels, 0, 0)

  if (isFull) {
    if (showP3.get() || (showRec2020.get() && !showP3.get())) {
      paintSeparator(ctx, bg, getLine(separators, Space.sRGB, Space.P3))
      paintSeparator(ctx, bg, getLine(separators, Space.P3, Space.sRGB))
    }
    if (showRec2020.get() && showP3.get()) {
      paintSeparator(ctx, bg, getLine(separators, Space.P3, Space.Rec2020))
      paintSeparator(ctx, bg, getLine(separators, Space.Rec2020, Space.P3))
    }
  }
}

export function paintL(
  canvas: HTMLCanvasElement,
  bg: string,
  l: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('l', isFull))
  let ctx = getCleanCtx(canvas)

  let hFactor = H_MAX / width
  let cFactor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / height

  paint(ctx, width, height, false, bg, isFull, (x, y) => {
    return build(l, y * cFactor, x * hFactor)
  })
}

export function paintC(
  canvas: HTMLCanvasElement,
  bg: string,
  c: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('c', isFull))
  let ctx = getCleanCtx(canvas)

  let hFactor = H_MAX / width
  let lFactor = L_MAX / height

  paint(ctx, width, height, true, bg, isFull, (x, y) => {
    return build(y * lFactor, c, x * hFactor)
  })
}

export function paintH(
  canvas: HTMLCanvasElement,
  bg: string,
  h: number,
  isFull: boolean
): void {
  let [width, height] = setScale(canvas, getQuickScale('h', isFull))
  let ctx = getCleanCtx(canvas)

  let lFactor = L_MAX / width
  let cFactor = (showRec2020.get() ? C_MAX_REC2020 : C_MAX) / height

  paint(ctx, width, height, false, bg, isFull, (x, y) => {
    return build(x * lFactor, y * cFactor, h)
  })
}
