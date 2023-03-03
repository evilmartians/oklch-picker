import type { MessageData } from './worker.js'

import {
  getQuickScale,
  RenderType,
  reportFreeze,
  reportPaint,
  reportQuick
} from '../../stores/benchmark.js'
import { atom, map } from 'nanostores'
import { setCurrentComponents, onPaint } from '../../stores/current.js'
import { getBorders, trackTime } from '../../lib/paint.js'
import { showCharts, showP3, showRec2020 } from '../../stores/settings.js'
import { initCanvasSize } from '../../lib/canvas.js'
import { paintCH, paintCL, paintLH } from './paint.js'
import PaintWorker from './worker.js?worker'

const MAX_SCALE = 8

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

function initCharts(): void {
  if (
    canvasL.transferControlToOffscreen &&
    canvasL.getContext('bitmaprenderer')
  ) {
    let isBusyL = atom<boolean>(false)
    let isBusyC = atom<boolean>(false)
    let isBusyH = atom<boolean>(false)

    let lastPendingL = atom<MessageData | null>(null)
    let lastPendingC = atom<MessageData | null>(null)
    let lastPendingH = atom<MessageData | null>(null)

    let ctxL = canvasL.getContext('bitmaprenderer')
    let ctxC = canvasC.getContext('bitmaprenderer')
    let ctxH = canvasH.getContext('bitmaprenderer')

    function send(worker: Worker, message: MessageData): void {
      worker.postMessage(message)
    }

    function init(workerType: RenderType): Worker {
      let worker = new PaintWorker()
      send(worker, {
        type: 'init',
        workerType: workerType,
        canvasLSize: canvasL.getBoundingClientRect(),
        canvasCSize: canvasC.getBoundingClientRect(),
        canvasHSize: canvasH.getBoundingClientRect(),
        pixelRation: Math.ceil(window.devicePixelRatio)
      })
      worker.onmessage = (e: MessageEvent<MessageData>) => {
        if (e.data.type === 'painted') {
          if (e.data.workerType === 'l') {
            isBusyL.set(false)
          } else if(e.data.workerType === 'c') {
            isBusyL.set(false)
          } else if (e.data.workerType === 'h') {
            isBusyL.set(false)
          }
          if (e.data.renderType === 'l') {
            ctxL!.transferFromImageBitmap(e.data.btm)
          } else if(e.data.renderType === 'c') {
            ctxC!.transferFromImageBitmap(e.data.btm)
          } else if (e.data.renderType === 'h') {
            ctxH!.transferFromImageBitmap(e.data.btm)
          }
          reportPaint(e.data.renderType, e.data.ms, e.data.isFull, true)
        }
      }
      return worker
    }

    let workerL = init('l')
    let workerC = init('c')
    let workerH = init('h')

    function sendMessageToUnbusyWorker(message: MessageData): null | void {
      if (!isBusyL.get()) {
        send(workerL, message)
      } else if (!isBusyC.get()) {
        send(workerC, message)
      } else if (!isBusyH.get()) {
        send(workerH, message)
      } else {
        return null
      }
    }

    isBusyL.listen((isBusy) => {if (!isBusy) lastPendingL.notify()})
    isBusyC.listen((isBusy) => {if (!isBusy) lastPendingC.notify()})
    isBusyH.listen((isBusy) => {if (!isBusy) lastPendingH.notify()})

    lastPendingL.listen((message) => {
      if (message) {
        isBusyL.set(true)
        sendMessageToUnbusyWorker(message)
        lastPendingL.set(null)
      }
    })
    lastPendingC.listen((message) => {if (message) {
      isBusyC.set(true)
      sendMessageToUnbusyWorker(message)
      lastPendingC.set(null)
    }})
    lastPendingH.listen((message) => {if (message) {
      isBusyH.set(true)
      sendMessageToUnbusyWorker(message)
      lastPendingH.set(null)
    }})

    onPaint({
      l(l, isFull) {
        if (!showCharts.get()) return
        let scale = getQuickScale('l', isFull)
        if (scale > MAX_SCALE) {
          reportQuick('l', 1)
          return
        }
        let [p3, rec2020] = getBorders()
        let message: MessageData = {
          type: 'l',
          isFull,
          lch: (L_MAX * l) / 100,
          scale,
          showP3: showP3.get(),
          showRec2020: showRec2020.get(),
          p3,
          rec2020
        }
        if (sendMessageToUnbusyWorker(message) === null) {
          lastPendingL.set(message)
        }
      },
      c(c, isFull) {
        if (!showCharts.get()) return
        let scale = getQuickScale('c', isFull)
        if (scale > MAX_SCALE) {
          reportQuick('c', 1)
          return
        }
        let [p3, rec2020] = getBorders()
        let message: MessageData = {
          type: 'c',
          isFull,
          lch: c,
          scale,
          showP3: showP3.get(),
          showRec2020: showRec2020.get(),
          p3,
          rec2020
        }
        if (sendMessageToUnbusyWorker(message) === null) {
          lastPendingL.set(message)
        }
      },
      h(h, isFull) {
        if (!showCharts.get()) return
        let scale = getQuickScale('h', isFull)
        if (scale > MAX_SCALE) {
          reportQuick('h', 1)
          return
        }
        let [p3, rec2020] = getBorders()
        let message: MessageData = {
          type: 'h',
          isFull,
          lch: h,
          scale,
          showP3: showP3.get(),
          showRec2020: showRec2020.get(),
          p3,
          rec2020
        }
        if (sendMessageToUnbusyWorker(message) === null) {
          lastPendingL.set(message)
        }
      }
    })
  } else {
    initCanvasSize(canvasL)
    initCanvasSize(canvasC)
    initCanvasSize(canvasH)

    onPaint({
      l(l, isFull) {
        if (!showCharts.get()) return
        let scale = getQuickScale('l', isFull)
        if (scale > MAX_SCALE) {
          reportQuick('l', 1)
          return
        }
        let [p3, rec2020] = getBorders()
        let ms = trackTime(() => {
          paintCH(
            canvasL,
            (L_MAX * l) / 100,
            scale,
            showP3.get(),
            showRec2020.get(),
            p3,
            rec2020
          )
        })
        reportPaint('l', ms, isFull)
      },
      c(c, isFull) {
        if (!showCharts.get()) return
        let scale = getQuickScale('c', isFull)
        if (scale > MAX_SCALE) {
          reportQuick('c', 1)
          return
        }
        let [p3, rec2020] = getBorders()
        let ms = trackTime(() => {
          paintLH(
            canvasC,
            c,
            scale,
            showP3.get(),
            showRec2020.get(),
            p3,
            rec2020
          )
        })
        reportPaint('c', ms, isFull)
      },
      h(h, isFull) {
        if (!showCharts.get()) return
        let scale = getQuickScale('h', isFull)
        if (scale > MAX_SCALE) {
          reportQuick('h', 1)
          return
        }
        let [p3, rec2020] = getBorders()
        let ms = trackTime(() => {
          paintCL(
            canvasH,
            h,
            scale,
            showP3.get(),
            showRec2020.get(),
            p3,
            rec2020
          )
        })
        reportPaint('h', ms, isFull)
      }
    })
  }
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
