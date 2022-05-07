import './reset.css'
import './index.css'
import { accent } from '../../stores/accent.js'

let theme = document.querySelector<HTMLMetaElement>('meta[name=theme-color]')!

accent.subscribe(({ main, surface, martian }) => {
  document.body.style.setProperty('--accent', main)
  document.body.style.setProperty('--surface-ui-accent', surface)
  document.body.style.setProperty('--martian', martian)
  theme.content = main
})

setTimeout(() => {
  document.body.classList.add('was-loaded')
}, 10)
