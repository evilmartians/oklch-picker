import { paintL, paintC, paintH } from './lib.js'
import { support } from '../stores/support.js'

export type MessageData =
  | {
      type: 'init'
      canvas: HTMLCanvasElement
    }
  | {
      type: 'l'
      l: number
      hasP3: boolean
      showP3: boolean
      showRec2020: boolean
      width: number
      height: number
    }
  | {
      type: 'c'
      c: number
      hasP3: boolean
      showP3: boolean
      showRec2020: boolean
      width: number
      height: number
    }
  | {
      type: 'h'
      h: number
      hasP3: boolean
      showP3: boolean
      showRec2020: boolean
      width: number
      height: number
    }

let canvas: HTMLCanvasElement | undefined

onmessage = (e: MessageEvent<MessageData>) => {
  if (e.data.type === 'init') {
    canvas = e.data.canvas
  } else if (canvas) {
    if (e.data.hasP3 !== support.get()) {
      support.set(e.data.hasP3)
    }

    let start = Date.now()
    if (e.data.type === 'l') {
      paintL(
        canvas,
        e.data.width,
        e.data.height,
        e.data.l,
        e.data.showP3,
        e.data.showRec2020
      )
    } else if (e.data.type === 'c') {
      paintC(
        canvas,
        e.data.width,
        e.data.height,
        e.data.c,
        e.data.showP3,
        e.data.showRec2020
      )
    } else {
      paintH(
        canvas,
        e.data.width,
        e.data.height,
        e.data.h,
        e.data.showP3,
        e.data.showRec2020
      )
    }
    postMessage(Date.now() - start)
  }
}
