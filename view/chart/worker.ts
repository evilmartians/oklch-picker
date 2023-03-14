import type { Rgb } from '../../lib/colors.js'

import { paintCH, paintCL, paintLH } from './paint.js'

export type PaintData = {
  type: 'l' | 'c' | 'h'
  width: number
  height: number
  from: number
  to: number
  value: number
  showP3: boolean
  showRec2020: boolean
  borderP3: Rgb
  borderRec2020: Rgb
}

export type PaintedData = {
  time: number
  pixels: ArrayBuffer
  width: number
  from: number
}

onmessage = (e: MessageEvent<PaintData>) => {
  let start = Date.now()

  let image: ImageData
  if (e.data.type === 'l') {
    image = paintCH(
      e.data.width,
      e.data.height,
      e.data.from,
      e.data.to,
      e.data.value,
      e.data.showP3,
      e.data.showRec2020,
      e.data.borderP3,
      e.data.borderRec2020
    )
  } else if (e.data.type === 'c') {
    image = paintLH(
      e.data.width,
      e.data.height,
      e.data.from,
      e.data.to,
      e.data.value,
      e.data.showP3,
      e.data.showRec2020,
      e.data.borderP3,
      e.data.borderRec2020
    )
  } else {
    image = paintCL(
      e.data.width,
      e.data.height,
      e.data.from,
      e.data.to,
      e.data.value,
      e.data.showP3,
      e.data.showRec2020,
      e.data.borderP3,
      e.data.borderRec2020
    )
  }

  let message: PaintedData = {
    time: Date.now() - start,
    pixels: image.data.buffer,
    width: image.width,
    from: e.data.from
  }
  postMessage(message, [image.data.buffer])
}
