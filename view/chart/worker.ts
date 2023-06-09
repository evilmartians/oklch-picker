import type { Rgb } from '../../lib/colors.js'
import { paintCH, paintCL, paintLH } from './paint.js'

export type PaintData = {
  borderP3: Rgb
  borderRec2020: Rgb
  from: number
  height: number
  showP3: boolean
  showRec2020: boolean
  to: number
  type: 'c' | 'h' | 'l'
  value: number
  width: number
}

export type PaintedData = {
  from: number
  pixels: ArrayBuffer
  time: number
  width: number
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
    from: e.data.from,
    pixels: image.data.buffer,
    time: Date.now() - start,
    width: image.width
  }
  postMessage(message, [image.data.buffer])
}
