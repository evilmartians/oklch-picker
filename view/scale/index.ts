import './index.css'
import {
  generateIsVisible,
  generateGetAlpha,
  format,
  build,
  inRGB,
  Color
} from '../../lib/colors.js'
import { onPaint, valueToColor } from '../../stores/current.js'
import { pixelRation } from '../../lib/screen.js'
import { getCleanCtx } from '../../lib/canvas.js'

let canvasL = document.querySelector<HTMLCanvasElement>('.scale.is-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('.scale.is-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('.scale.is-h')!
let divA = document.querySelector<HTMLDivElement>('.scale.is-a .scale_area')!

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
  showP3: boolean,
  showRec2020: boolean,
  getColor: (x: number) => Color
): void {
  let getAlpha = generateGetAlpha(showP3, showRec2020)
  let isVisible = generateIsVisible(showP3, showRec2020)

  for (let x = 0; x <= WIDTH; x++) {
    let color = getColor(x)
    if (!isVisible(color)) {
      if (hasGaps) {
        continue
      } else {
        return
      }
    }
    if (!inRGB(color)) {
      ctx.fillStyle = format(color)
      ctx.fillRect(x, HALF_HEIGHT, 1, HEIGHT)
      color.alpha = getAlpha(color)
      ctx.fillStyle = format(color)
      ctx.fillRect(x, 0, 1, HALF_HEIGHT)
    } else {
      ctx.fillStyle = format(color)
      ctx.fillRect(x, 0, 1, HEIGHT)
    }
  }
}

onPaint({
  ch(value, showP3, showRec2020) {
    let color = valueToColor(value)
    let c = color.c
    let h = color.h ?? 0
    let factor = L_MAX / WIDTH
    let ctx = getCleanCtx(canvasL)
    paint(ctx, true, showP3, showRec2020, x => build(x * factor, c, h))
  },
  lh(value, showP3, showRec2020) {
    let color = valueToColor(value)
    let l = color.l
    let h = color.h ?? 0
    let factor = C_MAX / WIDTH
    let ctx = getCleanCtx(canvasC)
    paint(ctx, false, showP3, showRec2020, x => build(l, x * factor, h))
  },
  lc(value, showP3, showRec2020) {
    let { l, c } = valueToColor(value)
    let factor = H_MAX / WIDTH
    let ctx = getCleanCtx(canvasH)
    paint(ctx, true, showP3, showRec2020, x => build(l, c, x * factor))
  },
  lch(value) {
    let color = valueToColor(value)
    let from = format({ ...color, alpha: 0 })
    let to = format(color)
    divA.style.background = `linear-gradient(to right, ${from}, ${to})`
  }
})
