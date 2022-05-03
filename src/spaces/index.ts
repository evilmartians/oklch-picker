/* eslint-disable import/extensions */
import type { MessageData } from './worker.js'

import './index.css'
import { bindFreezeToPaint, reportPaint } from '../stores/benchmark.js'
import { pixelRation, hasP3Support } from '../../lib/screen.js'
import { onCurrentChange, onPaint } from '../stores/current.js'
import { paintL, paintC, paintH } from './lib.js'
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
    root.style.setProperty('--spaces-l', `${l}%`)
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
      hasP3Support: !!hasP3Support
    })
    worker.onmessage = (e: MessageEvent<number>) => {
      reportPaint(e.data)
    }
    return worker
  }

  let workerL = init(canvasL)
  let workerC = init(canvasC)
  let workerH = init(canvasH, true)

  onPaint({
    l(l, showP3, showRec2020) {
      send(workerL, { type: 'l', l: l / 100, showP3, showRec2020 })
    },
    c(c, showP3, showRec2020) {
      send(workerC, { type: 'c', c, showP3, showRec2020 })
    },
    h(h, showP3, showRec2020) {
      send(workerH, { type: 'h', h, showP3, showRec2020 })
    }
  })
} else {
  bindFreezeToPaint()
  onPaint({
    l(l, showP3, showRec2020) {
      paintL(canvasL, WIDTH, HEIGHT, (L_MAX * l) / 100, showP3, showRec2020)
    },
    c(c, showP3, showRec2020) {
      paintC(canvasC, WIDTH, HEIGHT, c, showP3, showRec2020)
    },
    h(h, showP3, showRec2020) {
      paintH(canvasH, HEIGHT, HEIGHT, h, showP3, showRec2020)
    }
  })
}
