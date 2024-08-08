import { trackEvent } from '../analytics/index.js'

const THRESHOLD = 100

let main = document.querySelector<HTMLElement>('.main')!

let expand = main.querySelector<HTMLButtonElement>('.main_expand')!

let links = main.querySelectorAll<HTMLAnchorElement>('a')

let mobile = window.matchMedia('(max-width:830px)')

let startY = 0

let isExpanded = expand.ariaExpanded === 'true'

function changeExpanded(willBeExpanded = false): void {
  if (willBeExpanded === isExpanded) return

  isExpanded = willBeExpanded
  expand.ariaExpanded = String(isExpanded)
  document.body.classList.toggle('is-main-collapsed', !isExpanded)
}

main.addEventListener('touchmove', event => {
  event.preventDefault()
  let endY = event.changedTouches[0].clientY
  let diff = endY - startY
  let allowPositive = isExpanded && diff > 0
  let allowNegative = !isExpanded && diff < 0

  if (allowPositive || allowNegative) {
    main.style.setProperty('--touch-diff', `${diff}px`)
  }
})

main.addEventListener('touchstart', event => {
  event.preventDefault()
  startY = event.touches[0].clientY
})

main.addEventListener('touchend', event => {
  let endY = event.changedTouches[0].clientY
  let diff = startY - endY

  main.style.removeProperty('--touch-diff')

  if (Math.abs(diff) > THRESHOLD) {
    changeExpanded(diff > 0)
  }
})

function onScroll(): void {
  changeExpanded(false)
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
  changeExpanded(!isExpanded)
})

for (let link of links) {
  let event = 'Open Evil Martians'
  if (link.href.includes('sitnik')) event = 'Open Sitnik page'
  if (link.href.includes('romanshamin')) event = 'Open Shamin page'
  link.addEventListener('click', () => {
    trackEvent(event)
  })
}
