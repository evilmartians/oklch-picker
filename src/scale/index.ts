import './index.css'
import { inP3, oklch, inRGB, formatRgb, Color } from '../../lib/colors.js'
import { L_MAX, C_MAX, H_MAX, IMAGE_WIDTH } from '../../config.js'
import { onCurrentChange } from '../stores/current.js'
import { getCleanCtx } from '../../lib/canvas.js'

let canvasL = document.querySelector<HTMLCanvasElement>('#scale-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#scale-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#scale-h')!
let divAlpha = document.querySelector<HTMLDivElement>('#scale-alpha')!

const WIDTH = IMAGE_WIDTH * 2
const HEIGHT = 40

canvasL.width = WIDTH
canvasL.height = HEIGHT
canvasC.width = WIDTH
canvasC.height = HEIGHT
canvasH.width = WIDTH
canvasH.height = HEIGHT

function paintL(
  ctx: CanvasRenderingContext2D,
  hasGaps: boolean,
  getColor: (x: number) => Color
): void {
  let prevSRGB: boolean | undefined
  for (let x = 0; x <= WIDTH; x++) {
    let color = getColor(x)
    if (inP3(color)) {
      let inSRGB = inRGB(color)
      if (prevSRGB === undefined || inSRGB === prevSRGB) {
        ctx.fillStyle = formatRgb(color)
        ctx.fillRect(x, 0, 1, HEIGHT)
      }
      prevSRGB = inSRGB
    } else if (hasGaps) {
      prevSRGB = undefined
    } else {
      return
    }
  }
}

onCurrentChange({
  ch({ c, h }) {
    let factor = L_MAX / WIDTH
    let ctx = getCleanCtx(canvasL)
    paintL(ctx, true, x => oklch(x * factor, c, h))
  },
  lh({ l, h }) {
    let factor = C_MAX / WIDTH
    let ctx = getCleanCtx(canvasC)
    paintL(ctx, false, x => oklch(l, x * factor, h))
  },
  lc({ l, c }) {
    let factor = H_MAX / WIDTH
    let ctx = getCleanCtx(canvasH)
    paintL(ctx, true, x => oklch(l, c, x * factor))
  },
  lch({ l, c, h }) {
    let from = formatRgb(oklch(l, c, h, 0))
    let to = formatRgb(oklch(l, c, h))
    divAlpha.style.background = `linear-gradient(to right, ${from}, ${to})`
  }
})
