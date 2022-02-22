import Color from 'colorjs.io'

import './index.css'
import { onCurrentChange } from '../stores/current.js'
import { L_MAX, C_MAX, H_MAX } from '../../config.js'

let canvasL = document.querySelector<HTMLCanvasElement>('#scale-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#scale-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#scale-h')!

const WIDTH = canvasL.width * 2
const HEIGHT = 40

canvasL.width = WIDTH
canvasL.height = HEIGHT
canvasC.width = WIDTH
canvasC.height = HEIGHT
canvasH.width = WIDTH
canvasH.height = HEIGHT

function getCleanCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  let ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  return ctx
}

onCurrentChange({
  ch({ c, h }) {
    let cMod = c / 100
    let factor = L_MAX / WIDTH / 100
    let ctx = getCleanCtx(canvasL)

    let prevSRGB: boolean | undefined
    for (let x = 0; x <= WIDTH; x++) {
      let color = new Color('oklch', [x * factor, cMod, h])
      if (color.inGamut('p3')) {
        let inSRGB = color.inGamut('srgb')
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = color.to('srgb').toString()
          ctx.fillRect(x, 0, 1, HEIGHT)
        }
        prevSRGB = inSRGB
      } else {
        prevSRGB = undefined
      }
    }
  },
  lh({ l, h }) {
    let lMod = l / 100
    let factor = C_MAX / WIDTH / 100
    let ctx = getCleanCtx(canvasC)

    let prevSRGB: boolean | undefined
    for (let x = 0; x <= WIDTH; x++) {
      let color = new Color('oklch', [lMod, x * factor, h])
      if (color.inGamut('p3')) {
        let inSRGB = color.inGamut('srgb')
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = color.to('srgb').toString()
          ctx.fillRect(x, 0, 1, HEIGHT)
        }
        prevSRGB = inSRGB
      } else {
        break
      }
    }
  },
  lc({ l, c }) {
    let lMod = l / 100
    let cMod = c / 100
    let factor = H_MAX / WIDTH
    let ctx = getCleanCtx(canvasH)

    let prevSRGB: boolean | undefined
    for (let x = 0; x <= WIDTH; x++) {
      let color = new Color('oklch', [lMod, cMod, x * factor])
      if (color.inGamut('p3')) {
        let inSRGB = color.inGamut('srgb')
        if (prevSRGB === undefined || inSRGB === prevSRGB) {
          ctx.fillStyle = color.to('srgb').toString()
          ctx.fillRect(x, 0, 1, HEIGHT)
        }
        prevSRGB = inSRGB
      } else {
        prevSRGB = undefined
      }
    }
  }
})
