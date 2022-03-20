import './index.css'
import { current } from '../stores/current.js'
import { visible } from '../stores/visible.js'

let lchInput = document.querySelector<HTMLInputElement>('#text-lch')!
let rgbInput = document.querySelector<HTMLInputElement>('#text-rgb')!

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

current.subscribe(({ l, c, h, alpha }) => {
  let postfix = alpha < 1 ? ` / ${round(100 * alpha)}%` : ''
  lchInput.value = `lch(${round(100 * l)}% ${round(c)} ${round(h)}${postfix})`
})

visible.subscribe(({ rgb }) => {
  rgbInput.value = rgb
})
