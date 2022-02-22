import './index.css'
import { oklch, formatRgb } from '../../lib/colors.js'
import { current } from '../stores/current.js'

let example = document.querySelector<HTMLCanvasElement>('.example')!

current.subscribe(({ l, c, h, alpha }) => {
  let color = oklch(l, c, h, alpha)
  example.style.background = formatRgb(color)
})
