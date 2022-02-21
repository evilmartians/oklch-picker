import './index.css'
import { onCurrentChange } from '../stores/current.js'
import { L_MAX, C_MAX, H_MAX, IMAGE_WIDTH, IMAGE_HEIGHT } from '../../config.js'

let spaceL = document.querySelector<HTMLImageElement>('#spaces-l')!
let spaceC = document.querySelector<HTMLImageElement>('#spaces-c')!
let spaceH = document.querySelector<HTMLImageElement>('#spaces-h')!

let dotL = document.querySelector<HTMLDivElement>('#spaces-dot-l')!
let dotC = document.querySelector<HTMLDivElement>('#spaces-dot-c')!
let dotH = document.querySelector<HTMLDivElement>('#spaces-dot-h')!

function getUrl(axis: 'l' | 'c' | 'h', value: number): string {
  return `/spaces/${axis}-${Math.round(value)}.webp`
}

onCurrentChange({
  l(value) {
    spaceL.src = getUrl('l', value)
  },
  c(value) {
    spaceC.src = getUrl('c', value)
  },
  h(value) {
    spaceH.src = getUrl('h', value)
  },
  ch({ c, h }) {
    dotL.style.top = `${(100 * c) / C_MAX}%`
    dotL.style.left = `${(100 * h) / H_MAX}%`
  },
  lh({ l, h }) {
    dotC.style.top = `${(100 * l) / L_MAX}%`
    dotC.style.left = `${(100 * h) / H_MAX}%`
  },
  lc({ l, c }) {
    dotH.style.top = `${(100 * l) / L_MAX}%`
    dotH.style.left = `${(100 * c) / C_MAX}%`
  }
})
