import { trackEvent } from '../analytics/index.js'

const DETECT_THRESHOLD = 100

let main = document.querySelector<HTMLElement>('.main')!

let expand = main.querySelector<HTMLButtonElement>('.main_expand')!

let links = main.querySelectorAll<HTMLAnchorElement>('a')

let mobile = window.matchMedia('(max-width:830px)')

let startY = 0

main.addEventListener('touchstart', event => {
  startY = event.touches[0].clientY
})

main.addEventListener('touchend', event => {
  let endY = event.changedTouches[0].clientY
  let diff = startY - endY

  if (Math.abs(diff) < DETECT_THRESHOLD) return

  document.body.classList.toggle('is-main-collapsed', diff < 0)
})

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
