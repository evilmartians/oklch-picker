import Color from 'colorjs.io'

import './index.css'
import { onCurrentChange } from '../stores/current.js'
import { L_MAX, C_MAX, H_MAX } from '../../config.js'

let canvasL = document.querySelector<HTMLCanvasElement>('#scale-l')!
let canvasC = document.querySelector<HTMLCanvasElement>('#scale-c')!
let canvasH = document.querySelector<HTMLCanvasElement>('#scale-h')!

const WIDTH = canvasL.width * 2
const HEIGHT = canvasL.height * 2

canvasL.width = WIDTH
canvasL.height = HEIGHT
canvasC.width = WIDTH
canvasC.height = HEIGHT
canvasH.width = WIDTH
canvasH.height = HEIGHT

function render(
  canvas: HTMLCanvasElement,
  axis: 'l' | 'c' | 'h',
  l: number,
  c: number,
  h: number
): void {
  let getColor: (x: number) => [number, number, number]
  if (axis === 'l') {
    getColor = x => [(L_MAX * x) / WIDTH / 100, c / 100, h]
  } else if (axis === 'c') {
    getColor = x => [l / 100, (C_MAX * x) / WIDTH / 100, h]
  } else {
    getColor = x => [l / 100, c / 100, (H_MAX * x) / WIDTH]
  }

  let ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  let prevSRGB: boolean | undefined
  for (let x = 0; x <= WIDTH; x++) {
    let color = new Color('oklch', getColor(x))
    if (color.inGamut('p3')) {
      let inSRGB = color.inGamut('srgb')
      if (prevSRGB !== undefined && inSRGB !== prevSRGB) {
        color = color.mix(l < L_MAX / 2 ? '#fff' : '#000')
      }
      ctx.fillStyle = color.to('srgb').toString()
      ctx.fillRect(x, 0, 1, HEIGHT)
      prevSRGB = inSRGB
    } else {
      prevSRGB = undefined
    }
  }
}

onCurrentChange({
  ch(color) {
    render(canvasL, 'l', 0, color.c, color.h)
  },
  lh(color) {
    render(canvasC, 'c', color.l, 0, color.h)
  },
  lc(color) {
    render(canvasH, 'h', color.l, color.c, 0)
  }
})
