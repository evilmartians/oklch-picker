import { loading } from '../../stores/loading.js'
import { accent } from '../../stores/accent.js'

accent.subscribe(({ main, surface }) => {
  document.body.style.setProperty('--accent', main)
  document.body.style.setProperty('--surface-ui-accent', surface)
})

loading.subscribe(value => {
  document.body.classList.toggle('was-loaded', !value)
})

document.body.addEventListener('mousedown', () => {
  document.body.classList.add('is-grabbing')
})

document.body.addEventListener('mouseup', () => {
  document.body.classList.remove('is-grabbing')
})
