import './index.css'
import { current, onCurrentChange } from '../stores/current.js'

let l = document.querySelector<HTMLInputElement>('#numbers-l')!
let c = document.querySelector<HTMLInputElement>('#numbers-c')!
let h = document.querySelector<HTMLInputElement>('#numbers-h')!
let alpha = document.querySelector<HTMLInputElement>('#numbers-alpha')!
let sliderL = document.querySelector<HTMLInputElement>('#numbers-slider-l')!
let sliderC = document.querySelector<HTMLInputElement>('#numbers-slider-c')!
let sliderH = document.querySelector<HTMLInputElement>('#numbers-slider-h')!
let sliderAlpha = document.querySelector<HTMLInputElement>(
  '#numbers-slider-alpha'
)!

current.subscribe(color => {
  sliderL.value = l.value = String(color.l)
  sliderC.value = c.value = String(color.c)
  sliderH.value = h.value = String(color.h)
})

onCurrentChange({
  l(value) {
    sliderL.value = l.value = String(value)
  },
  c(value) {
    sliderC.value = c.value = String(value)
  },
  h(value) {
    sliderH.value = h.value = String(value)
  },
  alpha(value) {
    sliderAlpha.value = alpha.value = String(value)
  }
})

l.addEventListener('change', () => {
  current.setKey('l', parseFloat(l.value))
  sliderL.value = l.value
})
c.addEventListener('change', () => {
  current.setKey('c', parseFloat(c.value))
  sliderC.value = c.value
})
h.addEventListener('change', () => {
  current.setKey('h', parseFloat(h.value))
  sliderH.value = h.value
})
alpha.addEventListener('change', () => {
  current.setKey('alpha', parseFloat(alpha.value))
  sliderAlpha.value = alpha.value
})

sliderL.addEventListener('change', () => {
  current.setKey('l', parseFloat(sliderL.value))
  l.value = sliderL.value
})
sliderC.addEventListener('change', () => {
  current.setKey('c', parseFloat(sliderC.value))
  c.value = sliderC.value
})
sliderH.addEventListener('change', () => {
  current.setKey('h', parseFloat(sliderH.value))
  h.value = sliderH.value
})
sliderAlpha.addEventListener('change', () => {
  current.setKey('alpha', parseFloat(sliderAlpha.value))
  alpha.value = sliderAlpha.value
})
