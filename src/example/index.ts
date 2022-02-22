// @ts-expect-error
import { formatHex } from 'culori/fn'

import './index.css'
import { current } from '../stores/current.js'
import { oklch } from '../../lib/colors.js'

let example = document.querySelector<HTMLCanvasElement>('.example')!

current.subscribe(({ l, c, h }) => {
  let color = oklch(l, c, h)
  example.style.background = formatHex(color)
})
