import type { PaintMessageData, PaintedMessageData } from './worker.js'

import { atom } from 'nanostores'
import { setCurrentComponents, onPaint } from '../../stores/current.js'
import { getBorders, trackTime } from '../../lib/paint.js'
import { showCharts, showP3, showRec2020 } from '../../stores/settings.js'
import { initCanvasSize } from '../../lib/canvas.js'
import { support } from '../../stores/support.js'
import PaintWorker from './worker.js?worker'
import {
  lastBenchmark,
  reportPutImageDataFreeze,
  reportFull
} from '../../stores/benchmark.js'

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
    if (e.data.renderType === 'l') {
      if (pixelsL.length < 3) {
        pixelsL = [...pixelsL, e.data]
        renderTimeL += e.data.renderTime
      } else {
        let freezeTime = 0

        ;[...pixelsL, e.data].forEach(pixels => {
          let { pixelsBuffer, pixelsWidth, pixelsHeight, xPos, yPos } = pixels

          freezeTime += trackTime(() =>
            ctx.putImageData(
              new ImageData(
                new Uint8ClampedArray(pixelsBuffer),
                pixelsWidth,
                pixelsHeight
              ),
              0,
              0,
              xPos,
              pixelsHeight / 2 - yPos,
              pixelsWidth / 2,
              pixelsHeight / 2
            )
          )
        })

        pixelsL = []
        reportPutImageDataFreeze(freezeTime)
        reportFull(renderTimeL)
        renderTimeL = 0
        if (lastPendingL.get().length === 0) {
          isBusyL = false
        } else {
          lastPendingL.notify()
        }
      }
    } else if (e.data.renderType === 'c') {
      if (pixelsC.length < 3) {
        pixelsC = [...pixelsC, e.data]
        renderTimeC += e.data.renderTime
      } else {
        let freezeTime = 0

        ;[...pixelsC, e.data].forEach(pixels => {
          let { pixelsBuffer, pixelsWidth, pixelsHeight, xPos, yPos } = pixels

          freezeTime += trackTime(() => {
            ctx.putImageData(
              new ImageData(
                new Uint8ClampedArray(pixelsBuffer),
                pixelsWidth,
                pixelsHeight
              ),
              0,
              0,
              xPos,
              pixelsHeight / 2 - yPos,
              pixelsWidth / 2,
              pixelsHeight / 2
            )
          })
        })

        pixelsC = []
        isBusyC = false
        reportPutImageDataFreeze(freezeTime)
        reportFull(renderTimeC)
        renderTimeC = 0
        if (lastPendingC.get().length === 0) {
          isBusyC = false
        } else {
          lastPendingC.notify()
        }
      }
    } else if (e.data.renderType === 'h') {
      if (pixelsH.length < 3) {
        pixelsH = [...pixelsH, e.data]
        renderTimeH += e.data.renderTime
      } else {
        let freezeTime = 0

        ;[...pixelsH, e.data].forEach(pixels => {
          let { pixelsBuffer, pixelsWidth, pixelsHeight, xPos, yPos } = pixels

          freezeTime += trackTime(() => {
            ctx.putImageData(
              new ImageData(
                new Uint8ClampedArray(pixelsBuffer),
                pixelsWidth,
                pixelsHeight
              ),
              0,
              0,
              xPos,
              pixelsHeight / 2 - yPos,
              pixelsWidth / 2,
              pixelsHeight / 2
            )
          })
        })

        pixelsH = []
        reportPutImageDataFreeze(freezeTime)
        reportFull(renderTimeH)
        renderTimeH = 0
        if (lastPendingH.get().length === 0) {
          isBusyH = false
        } else {
          lastPendingH.notify()
        }
      }
    }
  }
  return worker
}

for (let i = 0; i < 12; i++) {
  if (i / 4 < 1) {
    workersL = [...workersL, init(ctxL)]
  } else if (i / 4 < 2) {
    workersC = [...workersC, init(ctxC)]
  } else if (i / 4 < 3) {
    workersH = [...workersH, init(ctxH)]
  }
}

lastPendingL.listen(messages => {
  if (messages.length === 4) {
    isBusyL = true
    workersL.forEach((worker, index) => {
      send(worker, messages[index])
    })
    lastPendingL.set([])
  }
})

lastPendingC.listen(messages => {
  if (messages.length === 4) {
    isBusyC = true
    workersC.forEach((worker, index) => {
      send(worker, messages[index])
    })
    lastPendingC.set([])
  }
})

lastPendingH.listen(messages => {
  if (messages.length === 4) {
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
      if (isBusyL === false) {
        isBusyL = true
        workersL.forEach((worker, index) => {
          send(worker, {
            renderType: 'l',
            width: canvasL.width,
            height: canvasL.height,
            xPos: index % 2 === 1 ? canvasL.width / 2 : 0,
            yPos: index > 1 ? canvasL.height / 2 : 0,
            lch: (L_MAX * l) / 100,
            showP3: showP3.get(),
            showRec2020: showRec2020.get(),
            p3,
            rec2020
          })
        })
      } else {
        workersL.forEach((_, index) => {
          lastPendingL.set([
            ...lastPendingL.get(),
            {
              renderType: 'l',
              width: canvasL.width,
              height: canvasL.height,
              xPos: index % 2 === 1 ? canvasL.width / 2 : 0,
              yPos: index > 1 ? canvasL.height / 2 : 0,
              lch: (L_MAX * l) / 100,
              showP3: showP3.get(),
              showRec2020: showRec2020.get(),
              p3,
              rec2020
            }
          ])
        })
      }
    },
    c(c) {
      if (!showCharts.get()) return
      let [p3, rec2020] = getBorders()
      if (isBusyC === false) {
        isBusyC = true
        workersC.forEach((worker, index) => {
          send(worker, {
            renderType: 'c',
            width: canvasL.width,
            height: canvasL.height,
            xPos: index % 2 === 1 ? canvasC.width / 2 : 0,
            yPos: index > 1 ? canvasC.height / 2 : 0,
            lch: c,
            showP3: showP3.get(),
            showRec2020: showRec2020.get(),
            p3,
            rec2020
          })
        })
      } else {
        workersC.forEach((_, index) => {
          lastPendingC.set([
            ...lastPendingC.get(),
            {
              renderType: 'c',
              width: canvasL.width,
              height: canvasL.height,
              xPos: index % 2 === 1 ? canvasC.width / 2 : 0,
              yPos: index > 1 ? canvasC.height / 2 : 0,
              lch: c,
              showP3: showP3.get(),
              showRec2020: showRec2020.get(),
              p3,
              rec2020
            }
          ])
        })
      }
    },
    h(h) {
      if (!showCharts.get()) return
      let [p3, rec2020] = getBorders()
      if (isBusyH === false) {
        isBusyH = true
        workersH.forEach((worker, index) => {
          send(worker, {
            renderType: 'h',
            width: canvasH.width,
            height: canvasH.height,
            xPos: index % 2 === 1 ? canvasH.width / 2 : 0,
            yPos: index > 1 ? canvasH.height / 2 : 0,
            lch: h,
            showP3: showP3.get(),
            showRec2020: showRec2020.get(),
            p3,
            rec2020
          })
        })
      } else {
        workersH.forEach((_, index) => {
          lastPendingH.set([
            ...lastPendingH.get(),
            {
              renderType: 'h',
              width: canvasH.width,
              height: canvasH.height,
              xPos: index % 2 === 1 ? canvasH.width / 2 : 0,
              yPos: index > 1 ? canvasH.height / 2 : 0,
              lch: h,
              showP3: showP3.get(),
              showRec2020: showRec2020.get(),
              p3,
              rec2020
            }
          ])
        })
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
