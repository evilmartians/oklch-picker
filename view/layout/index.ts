import { toggleVisibility } from '../../lib/dom.js'
import { show3d } from '../../stores/settings.js'
import { url } from '../../stores/url.js'

let layout = document.querySelector<HTMLDivElement>('.layout')!
let card3d = document.querySelector<HTMLDivElement>('.layout_3d')!

show3d.subscribe(enabled => {
  card3d.classList.toggle('is-shown', enabled)
})

url.subscribe(value => {
  toggleVisibility(layout, value !== '3d')
})
