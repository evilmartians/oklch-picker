import type { MessageData } from './worker.js'

import { setCurrentComponents, onPaint } from '../../stores/current.js'
import { getQuickScale, reportFreeze, reportPaint, reportQuick } from '../../stores/benchmark.js'
import { getBorders, trackTime } from '../../lib/paint.js'
import { showCharts, showP3, showRec2020 } from '../../stores/settings.js'
import { initCanvasSize } from '../../lib/canvas.js'
import { paintCH, paintCL, paintLH } from './paint.js'
import PaintWorker from './worker.js?worker'
import { atom, map } from 'nanostores'

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
  if (canvasL.transferControlToOffscreen) {
    interface IsWorkerBusy {
      l: boolean
      c: boolean
      h: boolean
    }
    interface Queue {
      l: MessageData[]
      c: MessageData[]
      h: MessageData[]
    }

    let isWorkerBusy: IsWorkerBusy = {
      l: false,
      c: false,
      h: false
    }
    let queue: Queue = {
      l: [],
      c: [],
      h: []
    }

    // let queue = atom<MessageData[] | null>(null)
    // let isWorkerBusy = map<IsWorkerBusy>({
    //   l: false,
    //   c: false,
    //   h: false
    // })

    // isWorkerBusy.listen((isWorkerBusy, key) => {
    //   console.log(isWorkerBusy[key])
    // })

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
        canvas: canvas.transferControlToOffscreen!(),
        pixelRation: Math.ceil(window.devicePixelRatio),
        canvasSize: canvasL.getBoundingClientRect()
      })
      worker.onmessage = (e: MessageEvent<MessageData>) => {
        if (e.data.type === 'reportPaint') {
          if (queue[e.data.renderType].length !== 0) {
            let ms = trackTime(() => {
              send(worker, queue[e.data.renderType][0])
            })
            reportFreeze(ms)
            // send(worker, queue[e.data.renderType][0])
            queue[e.data.renderType].shift()
          } else {
            isWorkerBusy[e.data.renderType] = false
          }
          // isWorkerBusy.setKey(e.data.renderType, false)
          reportPaint(e.data.renderType, e.data.ms, e.data.isFull, true)
        }
      }
      return worker
    }

    let workerL = init(canvasL)
    let workerC = init(canvasC)
    let workerH = init(canvasH)

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
          l: (L_MAX * l) / 100,
          scale,
          showP3: showP3.get(),
          showRec2020: showRec2020.get(),
          p3,
          rec2020
        }

        if (!isWorkerBusy.l) {
          isWorkerBusy.l = true
          let ms = trackTime(() => {
            send(workerL, message)
          })
          reportFreeze(ms)
        } else {
          queue.l = [...queue.l, message]
        }

        // if (!isWorkerBusy.get().l) {
        //   isWorkerBusy.setKey('l', true)
        //   let ms = trackTime(() => {
        //     send(workerL, message)
        //   })
        //   reportFreeze(ms)
        // } else if (queue.get()) {
        //   queue.set([...queue.get()!, message])
        // } else {
        //   queue.set([message])
        // }
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
          c,
          scale,
          showP3: showP3.get(),
          showRec2020: showRec2020.get(),
          p3,
          rec2020
        }

        if (!isWorkerBusy.c) {
          isWorkerBusy.c = true
          let ms = trackTime(() => {
            send(workerC, message)
          })
          reportFreeze(ms)
        } else {
          queue.c = [...queue.c, message]
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
          h,
          scale,
          showP3: showP3.get(),
          showRec2020: showRec2020.get(),
          p3,
          rec2020
        }

        if (!isWorkerBusy.h) {
          isWorkerBusy.h = true
          let ms = trackTime(() => {
            send(workerH, message)
          })
          reportFreeze(ms)
        } else {
          queue.h = [...queue.h, message]
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
