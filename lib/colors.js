import { modeOklch, useMode, modeRgb, modeP3, displayable } from 'culori/fn'

export { formatRgb } from 'culori/fn'

let p3 = useMode(modeP3)
useMode(modeRgb)
useMode(modeOklch)

export const inRGB = displayable

export function inP3(color) {
  let { r, b, g } = p3(color)
  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1
}

export function oklch(l, c, h, alpha = 1) {
  return { mode: 'oklch', l, c, h, alpha }
}
