export function getCleanCtx(
  canvas: HTMLCanvasElement
): CanvasRenderingContext2D {
  let ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  return ctx
}
