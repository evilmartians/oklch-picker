import type { PaintMessageData, PaintedMessageData } from './worker.js'

import {
  reportFrame,
  reportFreeze,
  reportFull
} from '../../stores/benchmark.js'
import {
  setCurrentComponents,
  onPaint,
  framesToChange
} from '../../stores/current.js'
import { getBorders } from '../../lib/paint.js'
import { showCharts, showP3, showRec2020 } from '../../stores/settings.js'
import { getCleanCtx, initCanvasSize } from '../../lib/canvas.js'
import PaintWorker from './worker.js?worker'

let chartL = document.querySelector<HTMLDivElement>('.chart.is-l')!
let chartC = document.querySelector<HTMLDivElement>('.chart.is-c')!
let chartH = document.querySelector<HTMLDivElement>('.chart.is-h')!
let canvasL = chartL.querySelector<HTMLCanvasElement>('.chart_canvas')!
let canvasC = chartC.querySelector<HTMLCanvasElement>('.chart_canvas')!
let canvasH = chartH.querySelector<HTMLCanvasElement>('.chart_canvas')!

function getMaxC(): number {
  return showRec2020.get() ? C_MAX_REC2020 : C_MAX
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(min, val), max)
}

onPaint({
  l(l) {
    document.body.style.setProperty('--chart-l', `${l}%`)
  },
  c(c) {
    document.body.style.setProperty('--chart-c', `${(100 * c) / getMaxC()}%`)
  },
  h(h) {
    document.body.style.setProperty('--chart-h', `${(100 * h) / H_MAX}%`)
  }
})

function setComponentsFromSpace(
  space: HTMLCanvasElement,
  mouseX: number,
  mouseY: number
): void {
  let rect = space.getBoundingClientRect()
  let x = clamp(mouseX - rect.left, 0, rect.width)
  let y = clamp(rect.height - (mouseY - rect.top), 0, rect.height)
  if (space.parentElement!.classList.contains('is-l')) {
    setCurrentComponents({
      h: (H_MAX * x) / rect.width,
      c: (getMaxC() * y) / rect.height
    })
  } else if (space.parentElement!.classList.contains('is-c')) {
    setCurrentComponents({
      l: (100 * y) / rect.height,
      h: (H_MAX * x) / rect.width
    })
  } else if (space.parentElement!.classList.contains('is-h')) {
    setCurrentComponents({
      l: (100 * x) / rect.width,
      c: (getMaxC() * y) / rect.height
    })
  }
}

function initEvents(chart: HTMLCanvasElement): void {
  function onSelect(e: MouseEvent): void {
    e.preventDefault()
    setComponentsFromSpace(chart, e.clientX, e.clientY)
  }

  function onMouseUp(e: MouseEvent): void {
    document.removeEventListener('mousemove', onSelect)
    document.removeEventListener('mouseup', onMouseUp)
    setComponentsFromSpace(chart, e.clientX, e.clientY)
  }

  chart.addEventListener('mousedown', () => {
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onSelect)
  })
}

initEvents(canvasL)
initEvents(canvasC)
initEvents(canvasH)

let unbusyWorkers: Worker[] = []
let busyWorkers: Worker[] = []

let totalWorkers = navigator.hardwareConcurrency
  ? navigator.hardwareConcurrency
  : 12

for (let i = 0; i < totalWorkers; i++) {
  unbusyWorkers = [...unbusyWorkers, init()]
}

let pixelsL: PaintedMessageData[] = []
let pixelsC: PaintedMessageData[] = []
let pixelsH: PaintedMessageData[] = []

let renderTimeL = 0
let renderTimeC = 0
let renderTimeH = 0

function init(): Worker {
  let worker = new PaintWorker()
  worker.onmessage = (e: MessageEvent<PaintedMessageData>) => {
    let start = Date.now()

    unbusyWorkers = [
      ...unbusyWorkers,
      ...busyWorkers.splice(busyWorkers.indexOf(worker), 1)
    ]

    if (e.data.renderType === 'l') {
      if (pixelsL.length < e.data.workers - 1) {
        pixelsL = [...pixelsL, e.data]
        renderTimeL += e.data.renderTime
      } else {
        let ctx = getCleanCtx(canvasL)

        ;[...pixelsL, e.data].forEach(pixels => {
          let { pixelsBuffer, pixelsWidth, pixelsHeight, xPos } = pixels

          ctx.putImageData(
            new ImageData(
              new Uint8ClampedArray(pixelsBuffer),
              pixelsWidth,
              pixelsHeight
            ),
            0,
            0,
            xPos,
            0,
            pixelsWidth / e.data.workers,
            pixelsHeight
          )
        })

        reportFull(Date.now())
        reportFrame(renderTimeL)

        pixelsL = []
        renderTimeL = 0
      }
    } else if (e.data.renderType === 'c') {
      if (pixelsC.length < e.data.workers - 1) {
        pixelsC = [...pixelsC, e.data]
        renderTimeC += e.data.renderTime
      } else {
        let ctx = getCleanCtx(canvasC)

        ;[...pixelsC, e.data].forEach(pixels => {
          let { pixelsBuffer, pixelsWidth, pixelsHeight, xPos } = pixels

          ctx.putImageData(
            new ImageData(
              new Uint8ClampedArray(pixelsBuffer),
              pixelsWidth,
              pixelsHeight
            ),
            0,
            0,
            xPos,
            0,
            pixelsWidth / e.data.workers,
            pixelsHeight
          )
        })

        reportFull(Date.now())
        reportFrame(renderTimeC)

        pixelsC = []
        renderTimeC = 0
      }
    } else {
      if (pixelsH.length < e.data.workers - 1) {
        pixelsH = [...pixelsH, e.data]
        renderTimeH += e.data.renderTime
      } else {
        let ctx = getCleanCtx(canvasH)

        ;[...pixelsH, e.data].forEach(pixels => {
          let { pixelsBuffer, pixelsWidth, pixelsHeight, xPos } = pixels

          ctx.putImageData(
            new ImageData(
              new Uint8ClampedArray(pixelsBuffer),
              pixelsWidth,
              pixelsHeight
            ),
            0,
            0,
            xPos,
            0,
            pixelsWidth / e.data.workers,
            pixelsHeight
          )
        })

        reportFull(Date.now())
        reportFrame(renderTimeH)

        pixelsH = []
        renderTimeH = 0
      }
    }

    reportFreeze(Date.now() - start)
  }
  return worker
}

function send(worker: Worker, message: PaintMessageData): void {
  worker.postMessage(message)
}

function loadWorkers(
  availableWorkers: number,
  canvas: HTMLCanvasElement,
  lch: number
): void {
  let [p3, rec2020] = getBorders()

  for (let i = 0; i < availableWorkers; i++) {
    send(unbusyWorkers[0], {
      renderType: canvas === canvasL ? 'l' : canvas === canvasC ? 'c' : 'h',
      width: canvas.width,
      height: canvas.height,
      workers: availableWorkers,
      xPos: i * Math.floor(canvas.width / availableWorkers),
      lch,
      showP3: showP3.get(),
      showRec2020: showRec2020.get(),
      p3,
      rec2020
    })
    busyWorkers = [...busyWorkers, ...unbusyWorkers.splice(0, 1)]
  }
}

function initCharts(): void {
  initCanvasSize(canvasL)
  initCanvasSize(canvasC)
  initCanvasSize(canvasH)

  onPaint({
    l(l) {
      if (!showCharts.get()) return
      let availableWorkers = Math.floor(totalWorkers / framesToChange.get())

      if (unbusyWorkers.length >= availableWorkers) {
        loadWorkers(availableWorkers, canvasL, (L_MAX * l) / 100)
      }
    },
    c(c) {
      if (!showCharts.get()) return
      let availableWorkers = Math.ceil(totalWorkers / framesToChange.get())

      if (unbusyWorkers.length >= availableWorkers) {
        loadWorkers(availableWorkers, canvasC, c)
      }
    },
    h(h) {
      if (!showCharts.get()) return
      let availableWorkers = Math.floor(totalWorkers / framesToChange.get())

      if (unbusyWorkers.length >= availableWorkers) {
        loadWorkers(availableWorkers, canvasH, h)
      }
    }
  })
}

if (showCharts.get()) {
  initCharts()
} else {
  let unbindCharts = showCharts.listen(show => {
    if (show) {
      unbindCharts()
      initCharts()
    }
  })
}
