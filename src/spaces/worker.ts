import { paintL, paintC, paintH } from './lib.js'
import { setColorSupport } from '../../lib/colors.js'

export type MessageData =
  | {
      type: 'init'
      canvas: HTMLCanvasElement
      width: number
      height: number
      hasP3Support: boolean
    }
  | { type: 'l'; l: number; showP3: boolean; showRec2020: boolean }
  | { type: 'c'; c: number; showP3: boolean; showRec2020: boolean }
  | { type: 'h'; h: number; showP3: boolean; showRec2020: boolean }

let prefix: [HTMLCanvasElement, number, number] | undefined

onmessage = (e: MessageEvent<MessageData>) => {
  if (e.data.type === 'init') {
    setColorSupport(e.data.hasP3Support)
    prefix = [e.data.canvas, e.data.width, e.data.height]
  } else if (prefix) {
    let start = Date.now()
    if (e.data.type === 'l') {
      paintL(...prefix, e.data.l, e.data.showP3, e.data.showRec2020)
    } else if (e.data.type === 'c') {
      paintC(...prefix, e.data.c, e.data.showP3, e.data.showRec2020)
    } else {
      paintH(...prefix, e.data.h, e.data.showP3, e.data.showRec2020)
    }
    postMessage(Date.now() - start)
  }
}
