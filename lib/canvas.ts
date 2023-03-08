import { support } from '../stores/support.js'

export function getCleanCtx(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D {
  let ctx = canvas.getContext('2d', {
    colorSpace: support.get().p3 ? 'display-p3' : 'srgb'
  })!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  return ctx
}

export let originSize = new Map<HTMLCanvasElement, [number, number]>()

export function initCanvasSize(canvas: HTMLCanvasElement): [number, number] {
  let pixelRation = 2
  let canvasSize = canvas.getBoundingClientRect()
  let width = canvasSize.width * pixelRation
  let height = canvasSize.height * pixelRation
  canvas.width = width
  canvas.height = height
  originSize.set(canvas, [width, height])
  return [width, height]
}
