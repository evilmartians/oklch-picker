import { trackEvent } from '../analytics/index.js'

let expand = document.querySelector<HTMLButtonElement>('.main_expand')!

let emText = document.querySelector<HTMLLinkElement>('.main_link.is-em')!
let emLogo = document.querySelector<HTMLLinkElement>('.main_logo')!

let links = document.querySelectorAll<HTMLLinkElement>('.main a')

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

const addHoverLogo = (): void => {
  emLogo.classList.add('is-hover')
}
const removeHoverLogo = (): void => {
  emLogo.classList.remove('is-hover')
}

emText.addEventListener('mouseenter', addHoverLogo)
emText.addEventListener('mouseleave', removeHoverLogo)
emText.addEventListener('focus', addHoverLogo)
emText.addEventListener('blur', removeHoverLogo)

emLogo.addEventListener('mouseenter', () => {
  emText.classList.add('is-hover')
})

emLogo.addEventListener('mouseleave', () => {
  emText.classList.remove('is-hover')
})

for (let link of links) {
  let event = 'Open Evil Martians'
  if (link.href.includes('sitnik')) event = 'Open Sitnik page'
  if (link.href.includes('romanshamin')) event = 'Open Shamin page'
  link.addEventListener('click', () => {
    trackEvent(event)
  })
}
