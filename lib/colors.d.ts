export interface Color {
  mode: string
}

export function inRGB(color: Color): boolean

export function inP3(color: Color): boolean

export function oklch(l: number, c: number, h: number): Color

export function formatHex(color: Color): string
