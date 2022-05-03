/* eslint-disable import/extensions */
import type { MessageData } from './worker.js'

import './index.css'
import {
  setCurrentComponents,
  onCurrentChange,
  onPaint
} from '../stores/current.js'
import { bindFreezeToPaint, reportPaint } from '../stores/benchmark.js'
import { paintL, paintC, paintH } from './lib.js'
import { pixelRation } from '../../lib/screen.js'
import { support } from '../stores/support.js'
import PaintWorker from './worker?worker'

let root = document.querySelector<HTMLCanvasElement>('.spaces')!

let canvasL = root.querySelector<HTMLCanvasElement>('#spaces-l')!
let canvasC = root.querySelector<HTMLCanvasElement>('#spaces-c')!
let canvasH = root.querySelector<HTMLCanvasElement>('#spaces-h')!

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

let spaces = root.querySelectorAll<HTMLDivElement>('.spaces_space')!

for (let space of spaces) {
  space.addEventListener('click', e => {
    let rect = space.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = rect.height - (e.clientY - rect.top)
    if (space.classList.contains('is-l')) {
      setCurrentComponents({
        h: (H_MAX * x) / rect.width,
        c: (C_MAX * y) / rect.height
      })
    } else if (space.classList.contains('is-c')) {
      setCurrentComponents({
        l: (100 * y) / rect.height,
        h: (H_MAX * x) / rect.width
      })
    } else if (space.classList.contains('is-h')) {
      setCurrentComponents({
        l: (100 * x) / rect.width,
        c: (C_MAX * y) / rect.height
      })
    }
  })
}

if (canvasL.transferControlToOffscreen) {
  function send(worker: Worker, message: MessageData): void {
    if (message.type === 'init') {
      worker.postMessage(message, [message.canvas])
    } else {
      worker.postMessage(message)
    }
  }

  function init(canvas: HTMLCanvasElement): Worker {
    let worker = new PaintWorker()
    send(worker, {
      type: 'init',
      canvas: canvas.transferControlToOffscreen!()
    })
    worker.onmessage = (e: MessageEvent<number>) => {
      reportPaint(e.data)
    }
    return worker
  }

  let workerL = init(canvasL)
  let workerC = init(canvasC)
  let workerH = init(canvasH)

  onPaint({
    l(l, showP3, showRec2020) {
      send(workerL, {
        type: 'l',
        l: l / 100,
        showP3,
        showRec2020,
        hasP3: support.get(),
        width: WIDTH,
        height: HEIGHT
      })
    },
    c(c, showP3, showRec2020) {
      send(workerC, {
        type: 'c',
        c,
        showP3,
        showRec2020,
        hasP3: support.get(),
        width: WIDTH,
        height: HEIGHT
      })
    },
    h(h, showP3, showRec2020) {
      send(workerH, {
        type: 'h',
        h,
        showP3,
        showRec2020,
        hasP3: support.get(),
        width: HEIGHT,
        height: HEIGHT
      })
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
