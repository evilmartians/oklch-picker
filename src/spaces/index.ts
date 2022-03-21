import './index.css'
import { P3_ALPHA, L_MAX, C_MAX, H_MAX } from '../../config.js'
import { inP3, build, inRGB, format, Color } from '../../lib/colors.js'
import { onCurrentChange } from '../stores/current.js'
import { pixelRation } from '../../lib/screen.js'
import { getCleanCtx } from '../../lib/canvas.js'

let canvasL = document.querySelector<HTMLCanvasElement>('#spaces-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#spaces-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#spaces-h')!

let dotL = document.querySelector<HTMLDivElement>('#spaces-dot-l')!
let dotC = document.querySelector<HTMLDivElement>('#spaces-dot-c')!
let dotH = document.querySelector<HTMLDivElement>('#spaces-dot-h')!

let canvasSize = canvasL.getBoundingClientRect()
const WIDTH = canvasSize.width * pixelRation
const HEIGHT = canvasSize.height * pixelRation

canvasL.width = WIDTH
canvasL.height = HEIGHT
canvasC.width = WIDTH
canvasC.height = HEIGHT
canvasH.width = WIDTH
canvasH.height = HEIGHT

interface GetColor {
  (x: number, y: number): Color
}

let DEBUG = false

const BLOCK = 4

function paintFast(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  p3: boolean,
  stepX: number,
  stepY: number,
  getColor: (x: number, y: number) => Color
): void {
  let flipY = HEIGHT - stepY + 1
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
        ctx.fillRect(x, HEIGHT - y, 1, 1)
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
  hasGaps: boolean,
  fastBlock: number,
  getColor: GetColor
): void {
  for (let x = 0; x <= WIDTH; x += BLOCK) {
    for (let y = 0; y <= HEIGHT; y += BLOCK) {
      let [someRGB, allRGB, someP3, allP3] = checkBlock(getColor, x, y)
      if (allRGB) {
        paintFast(ctx, x, y, false, BLOCK, fastBlock, getColor)
      } else if (allP3 && !someRGB) {
        paintFast(ctx, x, y, true, BLOCK, fastBlock, getColor)
      } else if (someP3) {
        paintSlow(ctx, x, y, getColor)
      } else if (!hasGaps) {
        if (DEBUG) {
          ctx.fillStyle = 'rgba(200 0 0 / 0.3)'
          ctx.fillRect(x, HEIGHT - y, BLOCK, -BLOCK)
        }
        break
      }
      if (DEBUG) {
        ctx.fillStyle = 'rgba(0 0 0 / 0.5)'
        ctx.fillRect(x + BLOCK / 2, HEIGHT - y - BLOCK / 2, 1, 1)
      }
    }
  }
}

function paintHorizontal(
  ctx: CanvasRenderingContext2D,
  getColor: GetColor
): void {
  for (let y = 0; y <= HEIGHT; y += BLOCK) {
    for (let x = 0; x <= WIDTH; x += BLOCK) {
      let [someRGB, allRGB, someP3, allP3] = checkBlock(getColor, x, y)
      if (allRGB) {
        paintFast(ctx, x, y, false, BLOCK, 2, getColor)
      } else if (allP3 && !someRGB) {
        paintFast(ctx, x, y, true, BLOCK, 2, getColor)
      } else if (someP3) {
        paintSlow(ctx, x, y, getColor)
      } else {
        if (DEBUG) {
          ctx.fillStyle = 'rgba(255 0 0 / 0.3)'
          ctx.fillRect(x, HEIGHT - y, BLOCK, -BLOCK)
        }
        break
      }
      if (DEBUG) {
        ctx.fillStyle = 'rgba(0 0 0 / 0.5)'
        ctx.fillRect(x + BLOCK / 2, HEIGHT - y - BLOCK / 2, 1, 1)
      }
    }
  }
}

onCurrentChange({
  l(l) {
    let ctx = getCleanCtx(canvasL)
    let hFactor = H_MAX / WIDTH
    let cFactor = C_MAX / HEIGHT
    paintVertical(ctx, false, BLOCK, (x, y) => {
      return build(l, y * cFactor, x * hFactor)
    })
  },
  c(c) {
    let ctx = getCleanCtx(canvasC)
    let hFactor = H_MAX / WIDTH
    let lFactor = L_MAX / HEIGHT
    paintVertical(ctx, true, 2, (x, y) => build(y * lFactor, c, x * hFactor))
  },
  h(h) {
    let ctx = getCleanCtx(canvasH)
    let cFactor = C_MAX / WIDTH
    let lFactor = L_MAX / HEIGHT
    paintHorizontal(ctx, (x, y) => build(y * lFactor, x * cFactor, h))
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
