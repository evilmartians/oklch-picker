import './index.css'
import { oklch, formatHex } from '../../lib/colors.js'
import { current } from '../stores/current.js'

let example = document.querySelector<HTMLCanvasElement>('.example')!

current.subscribe(({ l, c, h }) => {
  let color = oklch(l, c, h)
  example.style.background = formatHex(color)
})
