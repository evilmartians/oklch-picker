import { delay } from 'nanodelay'

import { showP3, showRec2020 } from '../../stores/settings.js'
import { is3d } from '../../stores/mode.js'

let button = document.querySelector<HTMLButtonElement>('[data-button=model]')!
let model = document.querySelector<HTMLDivElement>('.model')!

let showText = button.innerText

button.addEventListener('click', () => {
  is3d.set(!is3d.get())
})

let loading = true
let initialized = false

async function init(): Promise<void> {
  if (initialized) return
  initialized = true

  let { generate3d } = await import('./model.js')
  if (!loading) await delay(400)

  generate3d(showP3.get(), showRec2020.get())
  showP3.listen(() => {
    generate3d(showP3.get(), showRec2020.get())
  })
  showRec2020.listen(() => {
    generate3d(showP3.get(), showRec2020.get())
  })
}

is3d.subscribe(async value => {
  if (value) init()
  model.classList.toggle('is-shown', value)
  model.setAttribute('aria-hidden', value ? 'false' : 'true')
  button.innerText = value ? 'Hide 3D model' : showText
})

setTimeout(() => {
  loading = false
}, 500)
