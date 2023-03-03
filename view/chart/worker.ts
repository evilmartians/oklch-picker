import type { RenderType } from '../../stores/benchmark'
import type { IsWorkerBusy } from '.'

import { getCleanCtx, initCanvasSize } from '../../lib/canvas'
import { paintCH, paintCL, paintLH } from './paint'
import { trackTime } from '../../lib/paint'

export type MessageData =
  | {
      type: 'init'
      workerType: keyof IsWorkerBusy
      canvasLSize: DOMRect
      canvasCSize: DOMRect
      canvasHSize: DOMRect
      pixelRation: number
    }
  | {
      type: 'l'
      isFull: boolean
      l: number
      scale: number
      showP3: boolean
      showRec2020: boolean
      p3: string
      rec2020: string
    }
  | {
      type: 'c'
      isFull: boolean
      c: number
      scale: number
      showP3: boolean
      showRec2020: boolean
      p3: string
      rec2020: string
    }
  | {
      type: 'h'
      isFull: boolean
      h: number
      scale: number
      showP3: boolean
      showRec2020: boolean
      p3: string
      rec2020: string
    }
  | {
      type: 'painted'
      renderType: RenderType
      workerType: keyof IsWorkerBusy
      btm: ImageBitmap
      ms: number
      isFull: boolean
    }

let workerType: keyof IsWorkerBusy
let canvasL: OffscreenCanvas = new OffscreenCanvas(0, 0);
let canvasC: OffscreenCanvas = new OffscreenCanvas(0, 0);
let canvasH: OffscreenCanvas = new OffscreenCanvas(0, 0);

onmessage = (e: MessageEvent<MessageData>) => {
  if (e.data.type === 'init') {
    workerType = e.data.workerType
    initCanvasSize(canvasL, e.data.pixelRation, e.data.canvasLSize)
    initCanvasSize(canvasC, e.data.pixelRation, e.data.canvasCSize)
    initCanvasSize(canvasH, e.data.pixelRation, e.data.canvasHSize)
  } else {
    if (e.data.type === 'l') {
      let { type, isFull, l, scale, showP3, showRec2020, p3, rec2020 } = e.data
      let ms = trackTime(() => {
        paintCH(canvasL, l, scale, showP3, showRec2020, p3, rec2020)
      })
  
      let message: MessageData = {
        type: 'painted',
        renderType: type,
        workerType,
        btm: canvasL.transferToImageBitmap(),
        ms,
        isFull
      }
      postMessage(message)
    }
    if (e.data.type === 'c') {
      let { type, isFull, c, scale, showP3, showRec2020, p3, rec2020 } = e.data
      let ms = trackTime(() => {
        paintLH(canvasC, c, scale, showP3, showRec2020, p3, rec2020)
      })
  
      let message: MessageData = {
        type: 'painted',
        renderType: type,
        workerType,
        btm: canvasC.transferToImageBitmap(),
        ms,
        isFull
      }
      postMessage(message)
    }
    if (e.data.type === 'h') {
      let { type, isFull, h, scale, showP3, showRec2020, p3, rec2020 } = e.data
      let ms = trackTime(() => {
        paintCL(canvasH, h, scale, showP3, showRec2020, p3, rec2020)
      })
  
      let message: MessageData = {
        type: 'painted',
        renderType: type,
        workerType,
        btm: canvasH.transferToImageBitmap(),
        ms,
        isFull
      }
      postMessage(message)
    }
  }
}
