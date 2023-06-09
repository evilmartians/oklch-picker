import { current, toOtherValue } from '../../stores/current.js'

let other = document.querySelector<HTMLAnchorElement>(
  '.mode a:not(.is-current)'
)!

let domain = other.href

current.subscribe(value => {
  let { a, c, h, l } = toOtherValue(value)
  other.href = `${domain}#${l},${c},${h},${a}`
})
