import type { RenderType } from '../../stores/benchmark'

import { paintCH, paintCL, paintLH } from './paint'
import { trackTime } from '../../lib/paint'
import { workersPerCanvas } from '../../lib/canvas'

export type PaintMessageData = {
  renderType: RenderType
  width: number
  height: number
  xPos: number
  lch: number
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
  xPos: number
}

function send(message: PaintedMessageData, transfer: ArrayBufferLike[]) {
  postMessage(message, transfer)
}

onmessage = (e: MessageEvent<PaintMessageData>) => {
  let {
    renderType,
    width,
    height,
    xPos,
    lch,
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
        xPos,
        lch,
        showP3,
        showRec2020,
        p3,
        rec2020
      )
    } else if (renderType === 'c') {
      pixels = paintLH(
        width,
        height,
        xPos,
        lch,
        showP3,
        showRec2020,
        p3,
        rec2020
      )
    } else if (renderType === 'h') {
      pixels = paintCL(
        width,
        height,
        xPos,
        lch,
        showP3,
        showRec2020,
        p3,
        rec2020
      )
    }
  })

  send(
    {
      renderType,
      renderTime,
      pixelsBuffer: pixels.data.buffer,
      pixelsWidth: pixels.width,
      pixelsHeight: pixels.height,
      xPos
    },
    [pixels.data.buffer]
  )
}
