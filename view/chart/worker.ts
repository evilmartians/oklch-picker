import { initCanvasSize } from '../../lib/canvas'
import { RenderType, trackPaint } from '../../stores/benchmark'
import { paintCH, paintCL, paintLH } from './paint'

export type MessageData =
	| {
		type: 'init'
		canvas: OffscreenCanvas
	}
	| {
		type: 'initCanvasSize'
		pixelRation: number
		canvasSize: DOMRect
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
		type: 'reportPaint'
		renderType: RenderType
		ms: number
		isFull: boolean
	}

let canvas: OffscreenCanvas

onmessage = (e: MessageEvent<MessageData>) => {
	if (e.data.type === 'init') {
    canvas = e.data.canvas
  }

	if (e.data.type === 'initCanvasSize') {
		initCanvasSize(canvas, e.data.pixelRation, e.data.canvasSize)
	}

	if (e.data.type === 'l') {
		let { type, isFull, l, scale, showP3, showRec2020, p3, rec2020 } = e.data
		let ms = trackPaint('l', isFull, () => {
			paintCH(canvas, l, scale, showP3, showRec2020, p3, rec2020)
		})

		let message: MessageData = { renderType: type, type: 'reportPaint', ms, isFull }
		postMessage(message)
	}
	if (e.data.type === 'c') {
		let { type, isFull, c, scale, showP3, showRec2020, p3, rec2020 } = e.data
		let ms = trackPaint('c', isFull, () => {
			paintLH(canvas, c, scale, showP3, showRec2020, p3, rec2020)
		})

		let message: MessageData = { renderType: type, type: 'reportPaint', ms, isFull }
		postMessage(message)
	}
	if (e.data.type === 'h') {
		let { type, isFull, h, scale, showP3, showRec2020, p3, rec2020 } = e.data
		let ms = trackPaint('h', isFull, () => {
			paintCL(canvas, h, scale, showP3, showRec2020, p3, rec2020)
		})

		let message: MessageData = { renderType: type, type: 'reportPaint', ms, isFull }
		postMessage(message)
	}
}