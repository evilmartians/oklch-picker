import './index.css'
import { inP3, build, inRGB, format, Color } from '../../lib/colors.js'
import { L_MAX, C_MAX, H_MAX, P3_ALPHA } from '../../config.js'
import { onCurrentChange } from '../stores/current.js'
import { pixelRation } from '../../lib/screen.js'
import { getCleanCtx } from '../../lib/canvas.js'

let canvasL = document.querySelector<HTMLCanvasElement>('#scale-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#scale-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#scale-h')!
let divAlpha = document.querySelector<HTMLDivElement>('#scale-alpha')!

let canvasSize = canvasL.getBoundingClientRect()
const WIDTH = canvasSize.width * pixelRation
const HEIGHT = canvasSize.height * pixelRation
const HALF_HEIGHT = Math.floor(HEIGHT / 2)

canvasL.width = WIDTH
canvasL.height = HEIGHT
canvasC.width = WIDTH
canvasC.height = HEIGHT
canvasH.width = WIDTH
canvasH.height = HEIGHT

function paint(
  ctx: CanvasRenderingContext2D,
  hasGaps: boolean,
  getColor: (x: number) => Color
): void {
  for (let x = 0; x <= WIDTH; x++) {
    let color = getColor(x)
    if (inP3(color)) {
      if (!inRGB(color)) {
        ctx.fillStyle = format(color)
        ctx.fillRect(x, HALF_HEIGHT, 1, HEIGHT)
        color.alpha = P3_ALPHA
        ctx.fillStyle = format(color)
        ctx.fillRect(x, 0, 1, HALF_HEIGHT)
      } else {
        ctx.fillStyle = format(color)
        ctx.fillRect(x, 0, 1, HEIGHT)
      }
    } else if (!hasGaps) {
      return
    }
  }
}

onCurrentChange({
  ch({ c, h }) {
    let factor = L_MAX / WIDTH
    let ctx = getCleanCtx(canvasL)
    paint(ctx, true, x => build(x * factor, c, h))
  },
  lh({ l, h }) {
    let factor = C_MAX / WIDTH
    let ctx = getCleanCtx(canvasC)
    paint(ctx, false, x => build(l, x * factor, h))
  },
  lc({ l, c }) {
    let factor = H_MAX / WIDTH
    let ctx = getCleanCtx(canvasH)
    paint(ctx, true, x => build(l, c, x * factor))
  },
  lch({ l, c, h }) {
    let from = format(build(l, c, h, 0))
    let to = format(build(l, c, h))
    divAlpha.style.background = `linear-gradient(to right, ${from}, ${to})`
  }
})
