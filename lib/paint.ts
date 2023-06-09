import type { Pixel, Space } from './colors.js'

export type Separators = Partial<Record<`${Space}${Space}`, [number, number][]>>

export interface GetSeparator {
  (prevSpace: Space, nextSpace: Space): [number, number][]
}

export function generateGetSeparator(): GetSeparator {
  let separators: Separators = {}

  return function (prevSpace, nextSpace) {
    let line = separators[`${prevSpace}${nextSpace}`]
    if (line) {
      return line
    } else {
      return (separators[`${prevSpace}${nextSpace}`] = [])
    }
  }
}

export function paintPixel(
  pixels: ImageData,
  x: number,
  y: number,
  pixel: Pixel
): void {
  let pos = 4 * ((pixels.height - y) * pixels.width + x)
  pixels.data[pos] = pixel[1]
  pixels.data[pos + 1] = pixel[2]
  pixels.data[pos + 2] = pixel[3]
  pixels.data[pos + 3] = 255
}
