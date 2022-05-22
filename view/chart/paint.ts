import { Color, blend, parseRgb } from 'culori/fn'

import {
  generateIsVisible,
  inRec2020,
  IsVisible,
  format,
  inRGB,
  build,
  inP3
} from '../../lib/colors.js'
import { getCleanCtx } from '../../lib/canvas.js'

interface GetColor {
  (x: number, y: number): Color
}

let DEBUG = false

const BLOCK = 4

function paintDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  background: string,
  color: Color
): void {
  let bgColor = parseRgb(background)

  if (!inRGB(color) && inP3(color)) {
    color.alpha = 0.6
    bgColor.alpha = 1 - color.alpha
    color = blend([format(color), format(bgColor)], 'screen')
  } else if (!inRGB(color)) {
    color.alpha = 0.4
    bgColor.alpha = 1 - color.alpha
    color = blend([format(color), format(bgColor)], 'screen')
  }

  ctx.fillStyle = format(color)
  ctx.fillRect(x, y, width, height)
}

function paintFast(
  ctx: CanvasRenderingContext2D,
  height: number,
  bg: string,
  fromX: number,
  fromY: number,
  stepX: number,
  stepY: number,
  getColor: GetColor
): void {
  let flipY = height - stepY + 1
  for (let x = fromX; x < fromX + BLOCK; x += stepX) {
    for (let y = fromY; y < fromY + BLOCK; y += stepY) {
      let color = getColor(x, y)
      if (DEBUG) {
        ctx.fillStyle = 'rgba(0 200 0 / 0.6)'
        ctx.fillRect(x, flipY - y, 1, stepY)
        ctx.fillRect(x, flipY - y, stepX, 1)
        ctx.fillStyle = 'rgba(0 200 0 / 0.3)'
      }
      paintDot(ctx, x, flipY - y, stepX, stepY, bg, color)
    }
  }
}

function paintSlow(
  ctx: CanvasRenderingContext2D,
  height: number,
  bg: string,
  fromX: number,
  fromY: number,
  isVisible: IsVisible,
  getColor: GetColor
): void {
  for (let x = fromX; x < fromX + BLOCK; x += 1) {
    for (let y = fromY; y < fromY + BLOCK; y += 1) {
      let color = getColor(x, y)
      if (isVisible(color)) {
        if (DEBUG) {
          ctx.fillStyle = 'rgba(200 100 0 / 0.3)'
        }
        paintDot(ctx, x, height - y, 1, 1, bg, color)
      }
    }
  }
}

enum PaintMode {
  Inside,
  Between,
  Outside
}

function paint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hasGaps: boolean,
  fastBlock: number,
  bg: string,
  showP3: boolean,
  showRec2020: boolean,
  getColor: GetColor
): void {
  let isVisible = generateIsVisible(showP3, showRec2020)

  let getMode: (x: number, y: number) => PaintMode
  if (showP3 && showRec2020) {
    getMode = (x, y) => {
      let color00 = getColor(x, y)
      let color07 = getColor(x, y + BLOCK - 1)
      let color70 = getColor(x + BLOCK - 1, y)
      let color77 = getColor(x + BLOCK - 1, y + BLOCK - 1)

      let rgb00 = inRGB(color00)
      let rgb07 = inRGB(color07)
      let rgb70 = inRGB(color70)
      let rgb77 = inRGB(color77)

      let p00 = rgb00 || inP3(color00)
      let p07 = rgb07 || inP3(color07)
      let p70 = rgb70 || inP3(color70)
      let p77 = rgb77 || inP3(color77)

      let rec00 = p00 || inRec2020(color00)
      let rec07 = p07 || inRec2020(color07)
      let rec70 = p70 || inRec2020(color70)
      let rec77 = p77 || inRec2020(color77)

      let someRGB = rgb00 || rgb07 || rgb70 || rgb77
      let allRGB = rgb00 && rgb07 && rgb70 && rgb77
      let someP3 = p00 || p07 || p70 || p77
      let allP3 = p00 && p07 && p70 && p77
      let someRec2020 = rec00 || rec07 || rec70 || rec77
      let allRec2020 = rec00 && rec07 && rec70 && rec77

      if (allRGB || (allP3 && !someRGB) || (allRec2020 && !someP3)) {
        return PaintMode.Inside
      } else if (someRec2020) {
        return PaintMode.Between
      } else {
        return PaintMode.Outside
      }
    }
  } else if (!showP3 && showRec2020) {
    getMode = (x, y) => {
      let color00 = getColor(x, y)
      let color07 = getColor(x, y + BLOCK - 1)
      let color70 = getColor(x + BLOCK - 1, y)
      let color77 = getColor(x + BLOCK - 1, y + BLOCK - 1)

      let rgb00 = inRGB(color00)
      let rgb07 = inRGB(color07)
      let rgb70 = inRGB(color70)
      let rgb77 = inRGB(color77)

      let rec00 = rgb00 || inRec2020(color00)
      let rec07 = rgb07 || inRec2020(color07)
      let rec70 = rgb70 || inRec2020(color70)
      let rec77 = rgb77 || inRec2020(color77)

      let someRGB = rgb00 || rgb07 || rgb70 || rgb77
      let allRGB = rgb00 && rgb07 && rgb70 && rgb77
      let someRec2020 = rec00 || rec07 || rec70 || rec77
      let allRec2020 = rec00 && rec07 && rec70 && rec77

      if (allRGB || (allRec2020 && !someRGB)) {
        return PaintMode.Inside
      } else if (someRec2020) {
        return PaintMode.Between
      } else {
        return PaintMode.Outside
      }
    }
  } else if (showP3 && !showRec2020) {
    getMode = (x, y) => {
      let color00 = getColor(x, y)
      let color07 = getColor(x, y + BLOCK - 1)
      let color70 = getColor(x + BLOCK - 1, y)
      let color77 = getColor(x + BLOCK - 1, y + BLOCK - 1)

      let rgb00 = inRGB(color00)
      let rgb07 = inRGB(color07)
      let rgb70 = inRGB(color70)
      let rgb77 = inRGB(color77)

      let p00 = rgb00 || inP3(color00)
      let p07 = rgb07 || inP3(color07)
      let p70 = rgb70 || inP3(color70)
      let p77 = rgb77 || inP3(color77)

      let someRGB = rgb00 || rgb07 || rgb70 || rgb77
      let allRGB = rgb00 && rgb07 && rgb70 && rgb77
      let someP3 = p00 || p07 || p70 || p77
      let allP3 = p00 && p07 && p70 && p77

      if (allRGB || (allP3 && !someRGB)) {
        return PaintMode.Inside
      } else if (someP3) {
        return PaintMode.Between
      } else {
        return PaintMode.Outside
      }
    }
  } else {
    getMode = (x, y) => {
      let color00 = getColor(x, y)
      let color07 = getColor(x, y + BLOCK - 1)
      let color70 = getColor(x + BLOCK - 1, y)
      let color77 = getColor(x + BLOCK - 1, y + BLOCK - 1)

      let rgb00 = inRGB(color00)
      let rgb07 = inRGB(color07)
      let rgb70 = inRGB(color70)
      let rgb77 = inRGB(color77)

      if (rgb00 && rgb07 && rgb70 && rgb77) {
        return PaintMode.Inside
      } else if (rgb00 || rgb07 || rgb70 || rgb77) {
        return PaintMode.Between
      } else {
        return PaintMode.Outside
      }
    }
  }

  for (let x = 0; x <= width; x += BLOCK) {
    for (let y = 0; y <= height; y += BLOCK) {
      let pos = getMode(x, y)
      if (pos === PaintMode.Inside) {
        paintFast(ctx, height, bg, x, y, BLOCK, fastBlock, getColor)
      } else if (pos === PaintMode.Between) {
        paintSlow(ctx, height, bg, x, y, isVisible, getColor)
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

export function paintL(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  bg: string,
  showP3: boolean,
  showRec2020: boolean,
  l: number
): void {
  let ctx = getCleanCtx(canvas)
  let hFactor = H_MAX / width
  let cFactor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / height
  paint(ctx, width, height, false, BLOCK, bg, showP3, showRec2020, (x, y) => {
    return build(l, y * cFactor, x * hFactor)
  })
}

export function paintC(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  bg: string,
  showP3: boolean,
  showRec2020: boolean,
  c: number
): void {
  let ctx = getCleanCtx(canvas)
  let hFactor = H_MAX / width
  let lFactor = L_MAX / height
  paint(ctx, width, height, true, 2, bg, showP3, showRec2020, (x, y) => {
    return build(y * lFactor, c, x * hFactor)
  })
}

export function paintH(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  bg: string,
  showP3: boolean,
  showRec2020: boolean,
  h: number
): void {
  let ctx = getCleanCtx(canvas)
  let lFactor = L_MAX / width
  let cFactor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / height
  paint(ctx, width, height, true, BLOCK, bg, showP3, showRec2020, (x, y) => {
    return build(x * lFactor, y * cFactor, h)
  })
}
