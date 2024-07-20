import { accent } from '../../stores/accent.js'
import { redo, undo } from '../../stores/history.js'
import { loading } from '../../stores/loading.js'

accent.subscribe(({ main, surface }) => {
  document.body.style.setProperty('--accent', main)
  document.body.style.setProperty('--surface-ui-accent', surface)
})

loading.subscribe(value => {
  document.body.classList.toggle('is-loading', value)
})

document.body.addEventListener('mousedown', () => {
  document.body.classList.add('is-grabbing')
})

document.body.addEventListener('mouseup', () => {
  document.body.classList.remove('is-grabbing')
})

document.body.addEventListener('keydown', e => {
  if (
    ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
    ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
  ) {
    e.preventDefault()
    redo()
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    undo()
  }
})
