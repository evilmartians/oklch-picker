import './index.css'
import { toOtherValue, current } from '../../stores/current.js'

let link = document.querySelector<HTMLAnchorElement>('.mode a[href]')!

let domain = link.href

current.subscribe(value => {
  let { l, c, h, a } = toOtherValue(value)
  link.href = `${domain}#${l},${c},${h},${a}`
})
