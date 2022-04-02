import { inP3, inRGB, format, Color, build } from '../../lib/colors.js'
import { P3_ALPHA, L_MAX, C_MAX, H_MAX } from '../../config.js'
import { getCleanCtx } from '../../lib/canvas.js'

interface GetColor {
  (x: number, y: number): Color
}

let DEBUG = false

const BLOCK = 4

function paintFast(
  ctx: CanvasRenderingContext2D,
  height: number,
  fromX: number,
  fromY: number,
  p3: boolean,
  stepX: number,
  stepY: number,
  getColor: (x: number, y: number) => Color
): void {
  let flipY = height - stepY + 1
  for (let x = fromX; x < fromX + BLOCK; x += stepX) {
    for (let y = fromY; y < fromY + BLOCK; y += stepY) {
      let color = getColor(x, y)
      if (p3) color.alpha = P3_ALPHA
      ctx.fillStyle = format(color)
      if (DEBUG) {
        ctx.fillStyle = 'rgba(0 200 0 / 0.6)'
        ctx.fillRect(x, flipY - y, 1, stepY)
        ctx.fillRect(x, flipY - y, stepX, 1)
        ctx.fillStyle = 'rgba(0 200 0 / 0.3)'
      }
      ctx.fillRect(x, flipY - y, stepX, stepY)
    }
  }
}

function paintSlow(
  ctx: CanvasRenderingContext2D,
  height: number,
  fromX: number,
  fromY: number,
  getColor: GetColor
): void {
  for (let x = fromX; x < fromX + BLOCK; x += 1) {
    for (let y = fromY; y < fromY + BLOCK; y += 1) {
      let color = getColor(x, y)
      if (inP3(color)) {
        if (!inRGB(color)) color.alpha = P3_ALPHA
        ctx.fillStyle = format(color)
        if (DEBUG) {
          ctx.fillStyle = 'rgba(200 100 0 / 0.3)'
        }
        ctx.fillRect(x, height - y, 1, 1)
      }
    }
  }
}

function checkBlock(
  getColor: GetColor,
  x: number,
  y: number
): [boolean, boolean, boolean, boolean] {
  let color00 = getColor(x, y)
  let color07 = getColor(x, y + BLOCK - 1)
  let color70 = getColor(x + BLOCK - 1, y)
  let color77 = getColor(x + BLOCK - 1, y + BLOCK - 1)

  let rgb00 = inRGB(color00)
  let rgb07 = inRGB(color07)
  let rgb70 = inRGB(color70)
  let rgb77 = inRGB(color77)

  let p300 = rgb00 || inP3(color00)
  let p307 = rgb07 || inP3(color07)
  let p370 = rgb70 || inP3(color70)
  let p377 = rgb77 || inP3(color77)

  let someRGB = rgb00 || rgb07 || rgb70 || rgb77
  let allRGB = rgb00 && rgb07 && rgb70 && rgb77
  let someP3 = p300 || p307 || p370 || p377
  let allP3 = p300 && p307 && p370 && p377

  return [someRGB, allRGB, someP3, allP3]
}

function paintVertical(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasGaps: boolean,
  fastBlock: number,
  getColor: GetColor
): void {
  for (let x = 0; x <= width; x += BLOCK) {
    for (let y = 0; y <= height; y += BLOCK) {
      let [someRGB, allRGB, someP3, allP3] = checkBlock(getColor, x, y)
      if (allRGB) {
        paintFast(ctx, height, x, y, false, BLOCK, fastBlock, getColor)
      } else if (allP3 && !someRGB) {
        paintFast(ctx, height, x, y, true, BLOCK, fastBlock, getColor)
      } else if (someP3) {
        paintSlow(ctx, height, x, y, getColor)
      } else if (!hasGaps) {
        if (DEBUG) {
          ctx.fillStyle = 'rgba(200 0 0 / 0.3)'
          ctx.fillRect(x, height - y, BLOCK, -BLOCK)
        }
        break
      }
      if (DEBUG) {
        ctx.fillStyle = 'rgba(0 0 0 / 0.5)'
        ctx.fillRect(x + BLOCK / 2, height - y - BLOCK / 2, 1, 1)
      }
    }
  }
}

function paintHorizontal(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  getColor: GetColor
): void {
  for (let y = 0; y <= height; y += BLOCK) {
    for (let x = 0; x <= width; x += BLOCK) {
      let [someRGB, allRGB, someP3, allP3] = checkBlock(getColor, x, y)
      if (allRGB) {
        paintFast(ctx, height, x, y, false, BLOCK, 2, getColor)
      } else if (allP3 && !someRGB) {
        paintFast(ctx, height, x, y, true, BLOCK, 2, getColor)
      } else if (someP3) {
        paintSlow(ctx, height, x, y, getColor)
      } else {
        if (DEBUG) {
          ctx.fillStyle = 'rgba(255 0 0 / 0.3)'
          ctx.fillRect(x, height - y, BLOCK, -BLOCK)
        }
        break
      }
      if (DEBUG) {
        ctx.fillStyle = 'rgba(0 0 0 / 0.5)'
        ctx.fillRect(x + BLOCK / 2, height - y - BLOCK / 2, 1, 1)
      }
    }
  }
}

export function paintL(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  l: number
): void {
  let ctx = getCleanCtx(canvas)
  let hFactor = H_MAX / width
  let cFactor = C_MAX / height
  paintVertical(ctx, width, height, false, BLOCK, (x, y) => {
    return build(l, y * cFactor, x * hFactor)
  })
}

export function paintC(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  c: number
): void {
  let ctx = getCleanCtx(canvas)
  let hFactor = H_MAX / width
  let lFactor = L_MAX / height
  paintVertical(ctx, width, height, true, 2, (x, y) => {
    return build(y * lFactor, c, x * hFactor)
  })
}

export function paintH(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  h: number
): void {
  let ctx = getCleanCtx(canvas)
  let cFactor = C_MAX / width
  let lFactor = L_MAX / height
  paintHorizontal(ctx, width, height, (x, y) => {
    return build(y * lFactor, x * cFactor, h)
  })
}
