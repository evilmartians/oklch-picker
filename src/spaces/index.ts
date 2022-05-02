/* eslint-disable import/extensions */
import type { MessageData } from './worker.js'

import './index.css'
import { bindFreezeToPaint, reportPaint } from '../stores/benchmark.js'
import { pixelRation, hasP3Support } from '../../lib/screen.js'
import { paintL, paintC, paintH } from './lib.js'
import { onCurrentChange } from '../stores/current.js'
import PaintWorker from './worker?worker'

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
canvasH.width = HEIGHT
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

if (canvasL.transferControlToOffscreen) {
  function send(worker: Worker, message: MessageData): void {
    if (message.type === 'init') {
      worker.postMessage(message, [message.canvas])
    } else {
      worker.postMessage(message)
    }
  }

  function init(canvas: HTMLCanvasElement, isSquare = false): Worker {
    let worker = new PaintWorker()
    send(worker, {
      type: 'init',
      canvas: canvas.transferControlToOffscreen!(),
      width: isSquare ? HEIGHT : WIDTH,
      height: HEIGHT,
      p3: hasP3Support ?? false
    })
    worker.onmessage = (e: MessageEvent<number>) => {
      reportPaint(e.data)
    }
    return worker
  }

  let workerL = init(canvasL)
  let workerC = init(canvasC)
  let workerH = init(canvasH, true)

  onCurrentChange({
    l(l) {
      send(workerL, { type: 'l', l: l / 100 })
    },
    c(c) {
      send(workerC, { type: 'c', c })
    },
    h(h) {
      send(workerH, { type: 'h', h })
    }
  })
} else {
  bindFreezeToPaint()
  onCurrentChange({
    l(l) {
      paintL(canvasL, WIDTH, HEIGHT, (L_MAX * l) / 100)
    },
    c(c) {
      paintC(canvasC, WIDTH, HEIGHT, c)
    },
    h(h) {
      paintH(canvasH, HEIGHT, HEIGHT, h)
    }
  })
}
