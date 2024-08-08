import { trackEvent } from '../analytics/index.js'

let expand = document.querySelector<HTMLButtonElement>('.main_expand')!

let links = document.querySelectorAll<HTMLAnchorElement>('.main a')

let mobile = window.matchMedia('(max-width:830px)')

function onScroll(): void {
  document.body.classList.add('is-main-collapsed')
}

function init(): void {
  if (mobile.matches) {
    window.addEventListener('scroll', onScroll, { once: true })
  } else {
    window.removeEventListener('scroll', onScroll)
  }
}

init()
mobile.addEventListener('change', init)

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
