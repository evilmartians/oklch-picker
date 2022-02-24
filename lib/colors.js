import {
  clampChroma,
  displayable,
  modeOklch,
  formatRgb,
  formatCss,
  useMode,
  modeRgb,
  modeP3
} from 'culori/fn'

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

export const hasP3Support =
  window.matchMedia('(color-gamut: p3)').matches &&
  CSS.supports('color', 'color(display-p3 0 0 0)')

export let format
if (hasP3Support) {
  format = color => formatCss(p3(color))
} else {
  format = formatRgb
}

export function mapToRgb(color) {
  return formatRgb(clampChroma(color, 'oklch'))
}
