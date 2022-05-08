import './index.css'

let expand = document.querySelector<HTMLButtonElement>('.main_expand')!

let emText = document.querySelector<HTMLLinkElement>('.main_link.is-em')!
let emLogo = document.querySelector<HTMLLinkElement>('.main_logo')!

function onScroll(): void {
  document.body.classList.add('is-main-collapsed')
  window.removeEventListener('scroll', onScroll)
}

function init(): void {
  window.addEventListener('scroll', onScroll)
}

let mobile = window.matchMedia('(max-width: 908px)')
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

emText.addEventListener('mouseenter', () => {
  emLogo.classList.add('is-hover')
})

emText.addEventListener('mouseleave', () => {
  emLogo.classList.remove('is-hover')
})

emLogo.addEventListener('mouseenter', () => {
  emText.classList.add('is-hover')
})

emLogo.addEventListener('mouseleave', () => {
  emText.classList.remove('is-hover')
})
