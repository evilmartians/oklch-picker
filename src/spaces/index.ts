import './index.css'
import { bindFreezeToPaint } from '../stores/benchmark.js'
import { pixelRation } from '../../lib/screen.js'
import { paintL, paintC, paintH } from './lib.js'
import { L_MAX, C_MAX, H_MAX } from '../../config.js'
import { onCurrentChange } from '../stores/current.js'

let root = document.querySelector<HTMLCanvasElement>('.spaces')!

let canvasL = document.querySelector<HTMLCanvasElement>('#spaces-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#spaces-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#spaces-h')!

let canvasSize = canvasL.getBoundingClientRect()
const WIDTH = canvasSize.width * pixelRation
const HEIGHT = canvasSize.height * pixelRation

canvasL.width = WIDTH
canvasL.height = HEIGHT
canvasC.width = WIDTH
canvasC.height = HEIGHT
canvasH.width = WIDTH
canvasH.height = HEIGHT

onCurrentChange({
  l(l) {
    root.style.setProperty('--spaces-l', `${(100 * l) / L_MAX}%`)
  },
  c(c) {
    root.style.setProperty('--spaces-c', `${(100 * c) / C_MAX}%`)
  },
  h(h) {
    root.style.setProperty('--spaces-h', `${(100 * h) / H_MAX}%`)
  }
})

bindFreezeToPaint()
onCurrentChange({
  l(l) {
    paintL(canvasL, WIDTH, HEIGHT, l)
  },
  c(c) {
    paintC(canvasC, WIDTH, HEIGHT, c)
  },
  h(h) {
    paintH(canvasH, WIDTH, HEIGHT, h)
  }
})
