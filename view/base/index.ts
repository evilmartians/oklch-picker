import './reset.css'
import './index.css'
import { accent } from '../../stores/accent.js'

accent.subscribe(({ main, surface }) => {
  document.body.style.setProperty('--accent', main)
  document.body.style.setProperty('--surface-ui-accent', surface)
})

setTimeout(() => {
  document.body.classList.add('was-loaded')
}, 10)
