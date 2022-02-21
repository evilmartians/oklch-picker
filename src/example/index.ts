import Color from 'colorjs.io'

import './index.css'
import { current } from '../stores/current.js'

let example = document.querySelector<HTMLCanvasElement>('.example')!

current.subscribe(({ l, c, h }) => {
  let color = new Color('oklch', [l / 100, c / 100, h])
  example.style.background = color.to('srgb').toString()
})
