import './index.css'
import { hasP3Support } from '../../lib/screen.js'
import { visible } from '../stores/visible.js'

let example = document.querySelector<HTMLCanvasElement>('.example')!
let exampleRgb = document.querySelector<HTMLCanvasElement>('.example_rgb')!
let exampleP3 = document.querySelector<HTMLCanvasElement>('.example_p3')!

example.classList.toggle('is-supported', hasP3Support)
example.classList.toggle('is-unsupported', !hasP3Support)

visible.subscribe(({ rgb, p3, type }) => {
  example.classList.toggle('is-rgb', type === 'rgb')
  example.classList.toggle('is-p3', type === 'p3')
  example.classList.toggle('is-out', type === 'out')
  exampleP3.style.background = p3
  exampleRgb.style.background = rgb
})
