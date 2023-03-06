import type { Space, Pixel } from './colors.js'

export type Separators = Partial<Record<`${Space}${Space}`, [number, number][]>>

export function getBorders(): [string, string] {
  let styles = window.getComputedStyle(document.body)
  return [
    styles.getPropertyValue('--border-p3'),
    styles.getPropertyValue('--border-rec2020')
  ]
}

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

export function paintSeparatorPixel(
  pixels: ImageData,
  x: number,
  y: number,
  color: string
): void {
  let pos = 4 * (y * pixels.width + x)
  let colorArr = color
    .substring(color.indexOf('(') + 1, color.indexOf(')'))
    .split(',')
  pixels.data[pos] = +colorArr[0]
  pixels.data[pos + 1] = +colorArr[1]
  pixels.data[pos + 2] = +colorArr[2]
  pixels.data[pos + 3] = +colorArr[3] * 255
}

export function trackTime(cb: () => void): number {
  let start = Date.now()
  cb()
  return Date.now() - start
}
