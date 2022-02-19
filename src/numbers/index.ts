import { current } from '../stores/current.js'

let l = document.querySelector<HTMLInputElement>('#current-l')!
let c = document.querySelector<HTMLInputElement>('#current-c')!
let h = document.querySelector<HTMLInputElement>('#current-h')!

current.subscribe(color => {
  l.value = color.l
  c.value = color.c
  h.value = color.h
})

l.addEventListener('change', () => {
  current.setKey('l', l.value)
})

c.addEventListener('change', () => {
  current.setKey('c', c.value)
})

h.addEventListener('change', () => {
  current.setKey('h', h.value)
})
