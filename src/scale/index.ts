import './index.css'
import { inP3, build, inRGB, format, Color } from '../../lib/colors.js'
import { onCurrentChange, valueToColor } from '../stores/current.js'
import { L_MAX, C_MAX, H_MAX, P3_ALPHA } from '../../config.js'
import { pixelRation } from '../../lib/screen.js'
import { getCleanCtx } from '../../lib/canvas.js'

let canvasL = document.querySelector<HTMLCanvasElement>('.scale.is-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('.scale.is-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('.scale.is-h')!
let divAlpha = document.querySelector<HTMLDivElement>(
  '.scale.is-alpha .scale_area'
)!

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
        ctx.fillRect(x, 0, 1, HEIGHT)
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
  ch(value) {
    let color = valueToColor(value)
    let c = color.c
    let h = color.h ?? 0
    let factor = L_MAX / WIDTH
    let ctx = getCleanCtx(canvasL)
    paint(ctx, true, x => build(x * factor, c, h))
  },
  lh(value) {
    let color = valueToColor(value)
    let l = color.l
    let h = color.h ?? 0
    let factor = C_MAX / WIDTH
    let ctx = getCleanCtx(canvasC)
    paint(ctx, false, x => build(l, x * factor, h))
  },
  lc(value) {
    let { l, c } = valueToColor(value)
    let factor = H_MAX / WIDTH
    let ctx = getCleanCtx(canvasH)
    paint(ctx, true, x => build(l, c, x * factor))
  },
  lch(value) {
    let color = valueToColor(value)
    let from = format({ ...color, alpha: 0 })
    let to = format(color)
    divAlpha.style.background = `linear-gradient(to right, ${from}, ${to})`
  }
})
