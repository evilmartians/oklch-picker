export interface Color {
  mode: string
}

export function inRGB(color: Color): boolean

export function inP3(color: Color): boolean

export function oklch(l: number, c: number, h: number, alpha?: number): Color

export function formatRgb(color: Color): string
