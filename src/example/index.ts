import './index.css'
import { visible } from '../stores/visible.js'

let example = document.querySelector<HTMLCanvasElement>('.example')!
let exampleRgb = document.querySelector<HTMLCanvasElement>('.example_rgb')!
let exampleP3 = document.querySelector<HTMLCanvasElement>('.example_p3')!

visible.subscribe(({ rgb, p3, supported, type }) => {
  example.classList.toggle('is-rgb', type === 'rgb')
  example.classList.toggle('is-p3', type === 'p3')
  example.classList.toggle('is-out', type === 'out')
  example.classList.toggle('is-supported', supported)
  example.classList.toggle('is-unsupported', !supported)
  exampleP3.style.background = p3
  exampleRgb.style.background = rgb
})
