import { trackEvent } from '../analytics/index.js'

let expand = document.querySelector<HTMLButtonElement>('.main_expand')!

let links = document.querySelectorAll<HTMLAnchorElement>('.main a')

function onScroll(): void {
  document.body.classList.add('is-main-collapsed')
  window.removeEventListener('scroll', onScroll)
}

function init(): void {
  window.addEventListener('scroll', onScroll)
}

let mobile = window.matchMedia('(max-width:830px)')
if (mobile.matches) {
  init()
} else {
  mobile.addEventListener('change', () => {
    init()
  })
}

expand.addEventListener('click', () => {
  document.body.classList.toggle('is-main-collapsed')
})

for (let link of links) {
  let event = 'Open Evil Martians'
  if (link.href.includes('sitnik')) event = 'Open Sitnik page'
  if (link.href.includes('romanshamin')) event = 'Open Shamin page'
  link.addEventListener('click', () => {
    trackEvent(event)
  })
}
