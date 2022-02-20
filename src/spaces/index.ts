import './index.css'
import { current } from '../stores/current.js'

let l = document.querySelector<HTMLInputElement>('#spaces-l')!
let c = document.querySelector<HTMLInputElement>('#spaces-c')!
let h = document.querySelector<HTMLInputElement>('#spaces-h')!

function getUrl(axis: 'l' | 'c' | 'h', value: number): string {
  return `/spaces/${axis}-${Math.round(value)}.webp`
}

current.subscribe(color => {
  l.src = getUrl('l', color.l)
  c.src = getUrl('c', color.c)
  h.src = getUrl('h', color.h)
})
