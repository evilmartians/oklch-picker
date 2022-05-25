import './index.css'
import { toOtherValue, current } from '../../stores/current.js'

let other = document.querySelector<HTMLAnchorElement>(
  '.mode a:not(.is-current)'
)!

let domain = other.href

current.subscribe(value => {
  let { l, c, h, a } = toOtherValue(value)
  other.href = `${domain}#${l},${c},${h},${a}`
})
