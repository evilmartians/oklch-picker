import './index.css'
import { visible } from '../stores/visible.js'

let example = document.querySelector<HTMLDivElement>('.example')!
let spaceNote = example.querySelector<HTMLDivElement>('.example_note.is-space')!

visible.subscribe(({ space, real, fallback }) => {
  example.classList.toggle('is-srgb', space === 'srgb')
  example.classList.toggle('is-out', space === 'out')
  example.classList.toggle('is-supported', !!real)
  example.style.setProperty('--example-real', real || 'transparent')
  example.style.setProperty('--example-fallback', fallback)
  spaceNote.innerText = space === 'p3' || space === 'rec2020' ? space : ''
})
