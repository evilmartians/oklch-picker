import './index.css'
import { visible } from '../../stores/visible.js'

let sample = document.querySelector<HTMLDivElement>('.sample')!
let spaceNote = sample.querySelector<HTMLDivElement>('.sample_note.is-space')!

visible.subscribe(({ space, real, fallback }) => {
  sample.classList.toggle('is-srgb', space === 'srgb')
  sample.classList.toggle('is-out', space === 'out')
  sample.classList.toggle('is-supported', !!real)
  sample.style.setProperty('--sample-real', real || 'transparent')
  sample.style.setProperty('--sample-fallback', fallback)
  spaceNote.innerText = space === 'p3' || space === 'rec2020' ? space : ''
})
