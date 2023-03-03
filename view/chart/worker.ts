import type { RenderType } from '../../stores/benchmark'

import { initCanvasSize } from '../../lib/canvas'
import { paintCH, paintCL, paintLH } from './paint'
import { trackTime } from '../../lib/paint'

export type MessageData =
  | {
      type: 'init'
      workerType: RenderType
      canvasLSize: DOMRect
      canvasCSize: DOMRect
      canvasHSize: DOMRect
      pixelRation: number
    }
  | {
      type: RenderType
      isFull: boolean
      lch: number
      scale: number
      showP3: boolean
      showRec2020: boolean
      p3: string
      rec2020: string
    }
  | {
      type: 'painted'
      renderType: RenderType
      workerType: RenderType
      btm: ImageBitmap
      ms: number
      isFull: boolean
    }

let workerType: RenderType
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
      let { type, isFull, lch, scale, showP3, showRec2020, p3, rec2020 } = e.data
      let ms = trackTime(() => {
        paintCH(canvasL, lch, scale, showP3, showRec2020, p3, rec2020)
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
    } else if (e.data.type === 'c') {
      let { type, isFull, lch, scale, showP3, showRec2020, p3, rec2020 } = e.data
      let ms = trackTime(() => {
        paintLH(canvasC, lch, scale, showP3, showRec2020, p3, rec2020)
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
    } else if (e.data.type === 'h') {
      let { type, isFull, lch, scale, showP3, showRec2020, p3, rec2020 } = e.data
      let ms = trackTime(() => {
        paintCL(canvasH, lch, scale, showP3, showRec2020, p3, rec2020)
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
