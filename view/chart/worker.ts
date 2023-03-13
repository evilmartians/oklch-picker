import type { RenderType } from '../../stores/benchmark.js'

import { paintCH, paintCL, paintLH } from './paint.js'
import { trackTime } from '../../lib/time.js'

export type PaintMessageData = {
  renderType: RenderType
  width: number
  height: number
  workers: number
  xPos: number
  value: number
  showP3: boolean
  showRec2020: boolean
  p3: string
  rec2020: string
}

export type PaintedMessageData = {
  renderType: RenderType
  renderTime: number
  pixelsBuffer: ArrayBufferLike
  pixelsWidth: number
  pixelsHeight: number
  workers: number
  xPos: number
}

onmessage = (e: MessageEvent<PaintMessageData>) => {
  let {
    renderType,
    width,
    height,
    workers,
    xPos,
    value,
    showP3,
    showRec2020,
    p3,
    rec2020
  } = e.data

  let pixels!: ImageData
  let renderTime = trackTime(() => {
    if (renderType === 'l') {
      pixels = paintCH(
        width,
        height,
        workers,
        xPos,
        value,
        showP3,
        showRec2020,
        p3,
        rec2020
      )
    } else if (renderType === 'c') {
      pixels = paintLH(
        width,
        height,
        workers,
        xPos,
        value,
        showP3,
        showRec2020,
        p3,
        rec2020
      )
    } else {
      pixels = paintCL(
        width,
        height,
        workers,
        xPos,
        value,
        showP3,
        showRec2020,
        p3,
        rec2020
      )
    }
  })

  let message: PaintedMessageData = {
    renderType,
    renderTime,
    pixelsBuffer: pixels.data.buffer,
    pixelsWidth: pixels.width,
    pixelsHeight: pixels.height,
    workers,
    xPos
  }
  postMessage(message, [pixels.data.buffer])
}
