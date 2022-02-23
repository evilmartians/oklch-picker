import './index.css'
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
  P3_ALPHA,
  L_MAX,
  C_MAX,
  H_MAX
} from '../../config.js'
import { inP3, oklch, inRGB, formatRgb, Color } from '../../lib/colors.js'
import { onCurrentChange } from '../stores/current.js'
import { getCleanCtx } from '../../lib/canvas.js'

let canvasL = document.querySelector<HTMLCanvasElement>('#spaces-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#spaces-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#spaces-h')!

let dotL = document.querySelector<HTMLDivElement>('#spaces-dot-l')!
let dotC = document.querySelector<HTMLDivElement>('#spaces-dot-c')!
let dotH = document.querySelector<HTMLDivElement>('#spaces-dot-h')!

canvasL.width = IMAGE_WIDTH
canvasL.height = IMAGE_HEIGHT
canvasC.width = IMAGE_WIDTH
canvasC.height = IMAGE_HEIGHT
canvasH.width = IMAGE_WIDTH
canvasH.height = IMAGE_HEIGHT

const BLOCK = 8

function paintFast(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  p3: boolean,
  step: number,
  getColor: (x: number, y: number) => Color
): void {
  let flipY = IMAGE_HEIGHT - step + 1
  for (let x = fromX; x < fromX + BLOCK; x += step) {
    for (let y = fromY; y < fromY + BLOCK; y += step) {
      let color = getColor(x, y)
      if (p3) color.alpha = P3_ALPHA
      ctx.fillStyle = formatRgb(color)
      ctx.fillRect(x, flipY - y, step, step)
    }
  }
}

function paintSlow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  getColor: (x: number, y: number) => Color
): void {
  for (let x = fromX; x < fromX + BLOCK; x += 1) {
    for (let y = fromY; y < fromY + BLOCK; y += 1) {
      let color = getColor(x, y)
      if (inP3(color)) {
        if (!inRGB(color)) color.alpha = P3_ALPHA
        ctx.fillStyle = formatRgb(color)
        ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
      }
    }
  }
}

function paintVertical(
  ctx: CanvasRenderingContext2D,
  hasGaps: boolean,
  fastBlock: number,
  getColor: (x: number, y: number) => Color
): void {
  for (let x = 0; x <= IMAGE_WIDTH; x += BLOCK) {
    for (let y = 0; y <= IMAGE_HEIGHT; y += BLOCK) {
      let color00 = getColor(x, y)
      let color07 = getColor(x, y + BLOCK - 1)
      let color70 = getColor(x + BLOCK - 1, y)
      let color77 = getColor(x + BLOCK - 1, y + BLOCK - 1)

      let rgb00 = inRGB(color00)
      let rgb07 = inRGB(color07)
      let rgb70 = inRGB(color70)
      let rgb77 = inRGB(color77)

      let p300 = inP3(color00)
      let p307 = inP3(color07)
      let p370 = inP3(color70)
      let p377 = inP3(color77)

      let someRGB = rgb00 || rgb07 || rgb70 || rgb77
      let allRGB = rgb00 && rgb07 && rgb70 && rgb77
      let someP3 = p300 || p307 || p370 || p377
      let allP3 = p300 && p307 && p370 && p377

      if (allRGB) {
        paintFast(ctx, x, y, false, fastBlock, getColor)
      } else if (allP3 && !someRGB) {
        paintFast(ctx, x, y, true, fastBlock, getColor)
      } else if (someP3) {
        paintSlow(ctx, x, y, getColor)
      } else if (!hasGaps) {
        break
      }
    }
  }
}

function paintHorizontal(
  ctx: CanvasRenderingContext2D,
  getColor: (x: number, y: number) => Color
): void {
  for (let y = 0; y <= IMAGE_HEIGHT; y += BLOCK) {
    for (let x = 0; x <= IMAGE_WIDTH; x += BLOCK) {
      let color00 = getColor(x, y)
      let color07 = getColor(x, y + BLOCK - 1)
      let color70 = getColor(x + BLOCK - 1, y)
      let color77 = getColor(x + BLOCK - 1, y + BLOCK - 1)

      if (
        inRGB(color00) &&
        inRGB(color07) &&
        inRGB(color70) &&
        inRGB(color77)
      ) {
        paintFast(ctx, x, y, false, 2, getColor)
      } else if (
        inP3(color00) ||
        inP3(color07) ||
        inP3(color70) ||
        inP3(color77)
      ) {
        paintSlow(ctx, x, y, getColor)
      } else {
        break
      }
    }
  }
}

onCurrentChange({
  l(l) {
    let ctx = getCleanCtx(canvasL)
    let hFactor = H_MAX / IMAGE_WIDTH
    let cFactor = C_MAX / IMAGE_HEIGHT
    paintVertical(ctx, false, 4, (x, y) => oklch(l, y * cFactor, x * hFactor))
  },
  c(c) {
    let ctx = getCleanCtx(canvasC)
    let hFactor = H_MAX / IMAGE_WIDTH
    let lFactor = L_MAX / IMAGE_HEIGHT
    paintVertical(ctx, true, 2, (x, y) => oklch(y * lFactor, c, x * hFactor))
  },
  h(h) {
    let ctx = getCleanCtx(canvasH)
    let cFactor = C_MAX / IMAGE_WIDTH
    let lFactor = L_MAX / IMAGE_HEIGHT
    paintHorizontal(ctx, (x, y) => oklch(y * lFactor, x * cFactor, h))
  },
  ch({ c, h }) {
    dotL.style.bottom = `${(100 * c) / C_MAX}%`
    dotL.style.left = `${(100 * h) / H_MAX}%`
  },
  lh({ l, h }) {
    dotC.style.bottom = `${(100 * l) / L_MAX}%`
    dotC.style.left = `${(100 * h) / H_MAX}%`
  },
  lc({ l, c }) {
    dotH.style.bottom = `${(100 * l) / L_MAX}%`
    dotH.style.left = `${(100 * c) / C_MAX}%`
  }
})
