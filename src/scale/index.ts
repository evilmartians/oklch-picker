import './index.css'
import { L_MAX, C_MAX, H_MAX, IMAGE_WIDTH } from '../../config.js'
import { inP3, oklch, inRGB, formatHex } from '../../lib/colors.js'
import { onCurrentChange } from '../stores/current.js'
import { getCleanCtx } from '../../lib/canvas.js'

let canvasL = document.querySelector<HTMLCanvasElement>('#scale-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#scale-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#scale-h')!

const WIDTH = IMAGE_WIDTH * 2
const HEIGHT = 40

canvasL.width = WIDTH
canvasL.height = HEIGHT
canvasC.width = WIDTH
canvasC.height = HEIGHT
canvasH.width = WIDTH
canvasH.height = HEIGHT

onCurrentChange({
  ch({ c, h }) {
    let factor = L_MAX / WIDTH
    let ctx = getCleanCtx(canvasL)

    let prevSRGB: boolean | undefined
    for (let x = 0; x <= WIDTH; x++) {
      let color = oklch(x * factor, c, h)
      if (inP3(color)) {
        let inSRGB = inRGB(color)
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = formatHex(color)
          ctx.fillRect(x, 0, 1, HEIGHT)
        }
        prevSRGB = inSRGB
      } else {
        prevSRGB = undefined
      }
    }
  },
  lh({ l, h }) {
    let factor = C_MAX / WIDTH
    let ctx = getCleanCtx(canvasC)

    let prevSRGB: boolean | undefined
    for (let x = 0; x <= WIDTH; x++) {
      let color = oklch(l, x * factor, h)
      if (inP3(color)) {
        let inSRGB = inRGB(color)
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = formatHex(color)
          ctx.fillRect(x, 0, 1, HEIGHT)
        }
        prevSRGB = inSRGB
      } else {
        break
      }
    }
  },
  lc({ l, c }) {
    let factor = H_MAX / WIDTH
    let ctx = getCleanCtx(canvasH)

    let prevSRGB: boolean | undefined
    for (let x = 0; x <= WIDTH; x++) {
      let color = oklch(l, c, x * factor)
      if (inP3(color)) {
        let inSRGB = inRGB(color)
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = formatHex(color)
          ctx.fillRect(x, 0, 1, HEIGHT)
        }
        prevSRGB = inSRGB
      } else {
        prevSRGB = undefined
      }
    }
  }
})
