export interface Color {
  mode: string
  alpha?: number
}

export function inRGB(color: Color): boolean

export function inP3(color: Color): boolean

export function oklch(l: number, c: number, h: number, alpha?: number): Color

export const hasP3Support: boolean

export function format(color: Color): string

export function mapToRgb(color: Color): string
