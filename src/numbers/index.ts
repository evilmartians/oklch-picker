import './index.css'
import { current } from '../stores/current.js'

let l = document.querySelector<HTMLInputElement>('#numbers-l')!
let c = document.querySelector<HTMLInputElement>('#numbers-c')!
let h = document.querySelector<HTMLInputElement>('#numbers-h')!
let sliderL = document.querySelector<HTMLInputElement>('#numbers-slider-l')!
let sliderC = document.querySelector<HTMLInputElement>('#numbers-slider-c')!
let sliderH = document.querySelector<HTMLInputElement>('#numbers-slider-h')!

current.subscribe(color => {
  sliderL.value = l.value = String(color.l)
  sliderC.value = c.value = String(color.c)
  sliderH.value = h.value = String(color.h)
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
