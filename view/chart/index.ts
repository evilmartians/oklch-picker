/* eslint-disable import/extensions */
import type { MessageData } from './worker.js'

import './index.css'

import {
  setCurrentComponents,
  onCurrentChange,
  onPaint
} from '../../stores/current.js'
import { bindFreezeToPaint, reportPaint } from '../../stores/benchmark.js'
import { paintL, paintC, paintH } from './paint.js'
import { initCanvasSize } from '../../lib/canvas.js'
import { support } from '../../stores/support.js'
import PaintWorker from './worker?worker'

function findCanvas(type: 'l' | 'c' | 'h'): HTMLCanvasElement {
  return document.querySelector<HTMLCanvasElement>(
    `.chart.is-${type} .chart_canvas`
  )!
}

function getBackground(canvas: HTMLCanvasElement): string {
  return window.getComputedStyle(canvas).getPropertyValue('--current-surface')
}

let charts = document.querySelectorAll<HTMLDivElement>('.chart')
let canvasL = findCanvas('l')
let canvasC = findCanvas('c')
let canvasH = findCanvas('h')

onCurrentChange({
  l(l) {
    document.body.style.setProperty('--chart-l', `${l}%`)
  },
  c(c) {
    document.body.style.setProperty('--chart-c', `${(100 * c) / C_MAX}%`)
  },
  h(h) {
    document.body.style.setProperty('--chart-h', `${(100 * h) / H_MAX}%`)
  }
})

function onSelect(e: MouseEvent): void {
  let space = e.currentTarget as HTMLDivElement
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
}

for (let chart of charts) {
  chart.addEventListener('click', onSelect)
}

let [width, height] = initCanvasSize(canvasL)
initCanvasSize(canvasC)
initCanvasSize(canvasH)

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
      let bg = getBackground(canvasL)
      send(workerL, {
        type: 'l',
        l: (L_MAX * l) / 100,
        bg,
        showP3,
        showRec2020,
        hasP3: support.get(),
        width,
        height
      })
    },
    c(c, showP3, showRec2020) {
      let bg = getBackground(canvasC)
      send(workerC, {
        type: 'c',
        c,
        bg,
        showP3,
        showRec2020,
        hasP3: support.get(),
        width,
        height
      })
    },
    h(h, showP3, showRec2020) {
      let bg = getBackground(canvasH)
      send(workerH, {
        type: 'h',
        h,
        bg,
        showP3,
        showRec2020,
        hasP3: support.get(),
        width,
        height
      })
    }
  })
} else {
  bindFreezeToPaint()
  onPaint({
    l(l, showP3, showRec2020) {
      let bg = getBackground(canvasL)
      paintL(canvasL, width, height, bg, showP3, showRec2020, (L_MAX * l) / 100)
    },
    c(c, showP3, showRec2020) {
      let bg = getBackground(canvasC)
      paintC(canvasC, width, height, bg, showP3, showRec2020, c)
    },
    h(h, showP3, showRec2020) {
      let bg = getBackground(canvasH)
      paintH(canvasH, width, height, bg, showP3, showRec2020, h)
    }
  })
}
