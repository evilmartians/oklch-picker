import './index.css'
import { L_MAX, C_MAX, H_MAX, IMAGE_WIDTH, IMAGE_HEIGHT } from '../../config.js'
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

function paintVertical(
  ctx: CanvasRenderingContext2D,
  hasGaps: boolean,
  getColor: (x: number, y: number) => Color
): void {
  for (let x = 0; x <= IMAGE_WIDTH; x++) {
    let prevSRGB
    for (let y = 0; y <= IMAGE_HEIGHT; y++) {
      let color = getColor(x, y)

      if (inP3(color)) {
        let inSRGB = inRGB(color)
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = formatRgb(color)
          ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
        }
        prevSRGB = inSRGB
      } else if (hasGaps) {
        prevSRGB = false
      } else {
        break
      }
    }
  }
}

function paintHorizontal(
  ctx: CanvasRenderingContext2D,
  getColor: (x: number, y: number) => Color
): void {
  for (let y = 0; y <= IMAGE_HEIGHT; y++) {
    let prevSRGB
    for (let x = 0; x <= IMAGE_WIDTH; x++) {
      let color = getColor(x, y)

      if (inP3(color)) {
        let inSRGB = inRGB(color)
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = formatRgb(color)
          ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
        }
        prevSRGB = inSRGB
      } else {
        prevSRGB = false
      }
    }
  }
}

onCurrentChange({
  l(l) {
    let ctx = getCleanCtx(canvasL)
    let hFactor = H_MAX / IMAGE_WIDTH
    let cFactor = C_MAX / IMAGE_HEIGHT
    paintVertical(ctx, false, (x, y) => oklch(l, y * cFactor, x * hFactor))
  },
  c(c) {
    let ctx = getCleanCtx(canvasC)
    let hFactor = H_MAX / IMAGE_WIDTH
    let lFactor = L_MAX / IMAGE_HEIGHT
    paintVertical(ctx, true, (x, y) => oklch(y * lFactor, c, x * hFactor))
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
