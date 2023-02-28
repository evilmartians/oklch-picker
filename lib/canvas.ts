import { support } from '../stores/support.js'

type CanvasOrOffscreen<T extends OffscreenCanvas | HTMLCanvasElement> =
  T extends OffscreenCanvas
    ? OffscreenCanvasRenderingContext2D
    : CanvasRenderingContext2D

export function getCleanCtx<T extends OffscreenCanvas | HTMLCanvasElement>(
  canvas: T
): CanvasOrOffscreen<T> {
  let ctx = canvas.getContext('2d', {
    colorSpace: support.get().p3 ? 'display-p3' : 'srgb'
  })!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  return ctx as CanvasOrOffscreen<T>
}

let originSize = new Map<
  OffscreenCanvas | HTMLCanvasElement,
  [number, number]
>()

export function initCanvasSize(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  pixelRation: number = window.devicePixelRatio,
  canvasSize: DOMRect = (canvas as HTMLCanvasElement).getBoundingClientRect()
): [number, number] {
  let width = canvasSize.width * pixelRation
  let height = canvasSize.height * pixelRation
  canvas.width = width
  canvas.height = height
  originSize.set(canvas, [width, height])
  return [width, height]
}

export function setScale(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  scale: number
): [number, number] {
  let [originWidth, originalHeight] = originSize.get(canvas)!
  let width = Math.floor(originWidth / scale)
  let height = Math.floor(originalHeight / scale)
  canvas.width = width
  canvas.height = height
  return [width, height]
}
