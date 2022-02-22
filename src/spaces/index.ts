// @ts-expect-error
import { displayable, formatHex } from 'culori/fn'

import './index.css'
import { L_MAX, C_MAX, H_MAX, IMAGE_WIDTH, IMAGE_HEIGHT } from '../../config.js'
import { onCurrentChange } from '../stores/current.js'
import { inP3, oklch } from '../../lib/colors.js'
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

onCurrentChange({
  l(l) {
    let ctx = getCleanCtx(canvasL)
    let hFactor = H_MAX / IMAGE_WIDTH
    let cFactor = C_MAX / IMAGE_HEIGHT
    for (let x = 0; x <= IMAGE_WIDTH; x++) {
      let h = x * hFactor
      let prevSRGB
      for (let y = 0; y <= IMAGE_HEIGHT; y++) {
        let color = oklch(l, y * cFactor, h)

        if (inP3(color)) {
          let inSRGB = displayable(color)
          if (prevSRGB === undefined || inSRGB === prevSRGB) {
            ctx.fillStyle = formatHex(color)
            ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
          }
          prevSRGB = inSRGB
        } else {
          break
        }
      }
    }
  },
  c(c) {
    let ctx = getCleanCtx(canvasC)
    let hFactor = H_MAX / IMAGE_WIDTH
    let lFactor = L_MAX / IMAGE_HEIGHT
    for (let x = 0; x <= IMAGE_WIDTH; x++) {
      let h = x * hFactor
      let prevSRGB
      for (let y = 0; y <= IMAGE_HEIGHT; y++) {
        let color = oklch(y * lFactor, c, h)

        if (inP3(color)) {
          let inSRGB = displayable(color)
          if (prevSRGB === undefined || inSRGB === prevSRGB) {
            ctx.fillStyle = formatHex(color)
            ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
          }
          prevSRGB = inSRGB
        } else {
          prevSRGB = false
        }
      }
    }
  },
  h(h) {
    let ctx = getCleanCtx(canvasH)
    let cFactor = C_MAX / IMAGE_WIDTH
    let lFactor = L_MAX / IMAGE_HEIGHT
    for (let y = 0; y <= IMAGE_HEIGHT; y++) {
      let l = y * lFactor
      let prevSRGB
      for (let x = 0; x <= IMAGE_WIDTH; x++) {
        let color = oklch(l, x * cFactor, h)

        if (inP3(color)) {
          let inSRGB = displayable(color)
          if (prevSRGB === undefined || inSRGB === prevSRGB) {
            ctx.fillStyle = formatHex(color)
            ctx.fillRect(x, IMAGE_HEIGHT - y, 1, 1)
          }
          prevSRGB = inSRGB
        } else {
          prevSRGB = false
        }
      }
    }
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
