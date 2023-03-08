import type { RenderType } from '../../stores/benchmark'

import { paintCH, paintCL, paintLH } from './paint'
import { trackTime } from '../../lib/paint'

export type PaintMessageData = {
  renderType: RenderType
  width: number
  height: number
  xPos: number
  yPos: number
  lch: number
  showP3: boolean
  showRec2020: boolean
  p3: string
  rec2020: string,
  start?: number
}

export type PaintedMessageData = {
  renderType: RenderType
  renderTime: number
  pixelsBuffer: ArrayBufferLike
  pixelsWidth: number
  pixelsHeight: number
  xPos: number
  yPos: number,
  start?: number
}

function send(message: PaintedMessageData, transfer: ArrayBufferLike[]) {
  postMessage(message, transfer)
}

onmessage = (e: MessageEvent<PaintMessageData>) => {
  let start = Date.now()
  let {
    renderType,
    width,
    height,
    xPos,
    yPos,
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
        yPos,
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
        yPos,
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
        yPos,
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
      xPos,
      yPos,
      start: e.data.start
    },
    [pixels.data.buffer]
  )
  console.log(`1: ${Date.now() - start}`)
  start = 0
}
