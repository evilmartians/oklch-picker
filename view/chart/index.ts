import type { PaintMessageData, PaintedMessageData } from './worker.js'

import {
  reportFrame,
  reportFreeze,
  reportFull
} from '../../stores/benchmark.js'
import { atom } from 'nanostores'
import { setCurrentComponents, onPaint } from '../../stores/current.js'
import { getBorders, trackTime } from '../../lib/paint.js'
import { showCharts, showP3, showRec2020 } from '../../stores/settings.js'
import { initCanvasSize } from '../../lib/canvas.js'
import { support } from '../../stores/support.js'
import PaintWorker from './worker.js?worker'

let chartL = document.querySelector<HTMLDivElement>('.chart.is-l')!
let chartC = document.querySelector<HTMLDivElement>('.chart.is-c')!
let chartH = document.querySelector<HTMLDivElement>('.chart.is-h')!
let canvasL = chartL.querySelector<HTMLCanvasElement>('.chart_canvas')!
let canvasC = chartC.querySelector<HTMLCanvasElement>('.chart_canvas')!
let canvasH = chartH.querySelector<HTMLCanvasElement>('.chart_canvas')!
let ctxL = canvasL.getContext('2d', {
  colorSpace: support.get().p3 ? 'display-p3' : 'srgb'
})!
let ctxC = canvasC.getContext('2d', {
  colorSpace: support.get().p3 ? 'display-p3' : 'srgb'
})!
let ctxH = canvasH.getContext('2d', {
  colorSpace: support.get().p3 ? 'display-p3' : 'srgb'
})!

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

let workersL: Worker[] = []
let workersC: Worker[] = []
let workersH: Worker[] = []

let pixelsL: PaintedMessageData[] = []
let pixelsC: PaintedMessageData[] = []
let pixelsH: PaintedMessageData[] = []

let isBusyL = false
let isBusyC = false
let isBusyH = false

let lastPendingL = atom<PaintMessageData[]>([])
let lastPendingC = atom<PaintMessageData[]>([])
let lastPendingH = atom<PaintMessageData[]>([])

let renderTimeL = 0
let renderTimeC = 0
let renderTimeH = 0

function init(ctx: CanvasRenderingContext2D): Worker {
  let worker = new PaintWorker()
  worker.onmessage = (e: MessageEvent<PaintedMessageData>) => {
    let start = Date.now()
    if (e.data.renderType === 'l') {
      if (pixelsL.length < workersL.length - 1) {
        pixelsL = [...pixelsL, e.data]
        renderTimeL += e.data.renderTime
      } else {
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
            pixelsWidth / workersL.length,
            pixelsHeight
          )
        })

        reportFull(Date.now())
        reportFrame(renderTimeL)

        pixelsL = []
        renderTimeL = 0
        isBusyL = false
        lastPendingL.notify()
      }
    } else if (e.data.renderType === 'c') {
      if (pixelsC.length < workersC.length - 1) {
        pixelsC = [...pixelsC, e.data]
        renderTimeC += e.data.renderTime
      } else {
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
            pixelsWidth / workersC.length,
            pixelsHeight
          )
        })

        reportFull(Date.now())
        reportFrame(renderTimeC)

        pixelsC = []
        renderTimeC = 0
        isBusyC = false
        lastPendingC.notify()
      }
    } else {
      if (pixelsH.length < workersH.length - 1) {
        pixelsH = [...pixelsH, e.data]
        renderTimeH += e.data.renderTime
      } else {
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
            pixelsWidth / workersH.length,
            pixelsHeight
          )
        })

        reportFull(Date.now())
        reportFrame(renderTimeH)

        pixelsH = []
        renderTimeH = 0
        isBusyH = false
        lastPendingH.notify()
      }
    }

    reportFreeze(Date.now() - start)
  }
  return worker
}

let totalWorkers = navigator.hardwareConcurrency
  ? navigator.hardwareConcurrency
  : 12

for (let i = 0; i < totalWorkers; i++) {
  if (i / Math.floor(totalWorkers / 3) < 1) {
    workersL = [...workersL, init(ctxL)]
  } else if (i / Math.floor(totalWorkers / 3) < 2) {
    workersH = [...workersH, init(ctxH)]
  } else {
    workersC = [...workersC, init(ctxC)]
  }
}

lastPendingL.listen(messages => {
  if (!isBusyL && messages.length === workersL.length) {
    isBusyL = true
    workersL.forEach((worker, index) => {
      send(worker, messages[index])
    })
    lastPendingL.set([])
  }
})

lastPendingC.listen(messages => {
  if (!isBusyC && messages.length === workersC.length) {
    isBusyC = true
    workersC.forEach((worker, index) => {
      send(worker, messages[index])
    })
    lastPendingC.set([])
  }
})

lastPendingH.listen(messages => {
  if (!isBusyH && messages.length === workersH.length) {
    isBusyH = true
    workersH.forEach((worker, index) => {
      send(worker, messages[index])
    })
    lastPendingH.set([])
  }
})

function send(worker: Worker, message: PaintMessageData): void {
  worker.postMessage(message)
}

function initCharts(): void {
  initCanvasSize(canvasL)
  initCanvasSize(canvasC)
  initCanvasSize(canvasH)

  onPaint({
    l(l) {
      if (!showCharts.get()) return
      let [p3, rec2020] = getBorders()
      lastPendingL.set([])
      workersL.forEach((_, index) => {
        lastPendingL.set([
          ...lastPendingL.get(),
          {
            renderType: 'l',
            width: canvasL.width,
            height: canvasL.height,
            section: Math.floor(canvasL.width / workersL.length),
            xPos: index * Math.floor(canvasL.width / workersL.length),
            lch: (L_MAX * l) / 100,
            showP3: showP3.get(),
            showRec2020: showRec2020.get(),
            p3,
            rec2020
          }
        ])
      })
    },
    c(c) {
      if (!showCharts.get()) return
      let [p3, rec2020] = getBorders()
      lastPendingC.set([])
      workersC.forEach((_, index) => {
        lastPendingC.set([
          ...lastPendingC.get(),
          {
            renderType: 'c',
            width: canvasL.width,
            height: canvasL.height,
            section: Math.floor(canvasC.width / workersC.length),
            xPos: index * Math.floor(canvasC.width / workersC.length),
            lch: c,
            showP3: showP3.get(),
            showRec2020: showRec2020.get(),
            p3,
            rec2020
          }
        ])
      })
    },
    h(h) {
      if (!showCharts.get()) return
      let [p3, rec2020] = getBorders()
      lastPendingH.set([])
      workersH.forEach((_, index) => {
        lastPendingH.set([
          ...lastPendingH.get(),
          {
            renderType: 'h',
            width: canvasH.width,
            height: canvasH.height,
            section: Math.floor(canvasH.width / workersH.length),
            xPos: index * Math.floor(canvasH.width / workersH.length),
            lch: h,
            showP3: showP3.get(),
            showRec2020: showRec2020.get(),
            p3,
            rec2020
          }
        ])
      })
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
