import './index.css'
import {
  valueToColor,
  colorToValue,
  current,
  round2,
  round3
} from '../../stores/current.js'
import { oklch, lch } from '../../lib/colors.js'

let link = document.querySelector<HTMLAnchorElement>('.mode a[href]')!

let domain = link.href

current.subscribe(value => {
  let color = valueToColor(value)
  let { l, c, h, a } = colorToValue(LCH ? oklch(color) : lch(color))
  if (!LCH) {
    l /= 100
  } else {
    l *= 100
  }
  let roundC = !LCH ? round2 : round3
  link.href = `${domain}#${round2(l)},${roundC(c)},${round2(h)},${round2(a)}`
})
