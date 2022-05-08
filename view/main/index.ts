import './index.css'

let main = document.querySelector<HTMLDivElement>('.main')!
let expand = document.querySelector<HTMLButtonElement>('.main_expand')!

function onScroll(): void {
  main.classList.add('is-collapsed')
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
  main.classList.toggle('is-collapsed')
})
