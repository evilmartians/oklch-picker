import { modeOklch, useMode, modeRgb, modeP3 } from 'culori/fn'

export let rgb = useMode(modeRgb)
export let p3 = useMode(modeP3)
useMode(modeOklch)

export function inP3(color) {
  let conv = p3(color)
  return (
    conv.r >= 0 &&
    conv.r <= 1 &&
    conv.g >= 0 &&
    conv.g <= 1 &&
    conv.b >= 0 &&
    conv.b <= 1
  )
}

export function oklch(l, c, h) {
  return { mode: 'oklch', l, c, h }
}
