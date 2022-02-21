import './index.css'
import { onCurrentChange } from '../stores/current.js'

let l = document.querySelector<HTMLInputElement>('#spaces-l')!
let c = document.querySelector<HTMLInputElement>('#spaces-c')!
let h = document.querySelector<HTMLInputElement>('#spaces-h')!

function getUrl(axis: 'l' | 'c' | 'h', value: number): string {
  return `/spaces/${axis}-${Math.round(value)}.webp`
}

onCurrentChange({
  l(value) {
    l.src = getUrl('l', value)
  },
  c(value) {
    c.src = getUrl('c', value)
  },
  h(value) {
    h.src = getUrl('h', value)
  }
})
