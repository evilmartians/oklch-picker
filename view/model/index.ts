import { delay } from 'nanodelay'

import { showP3, showRec2020, show3d } from '../../stores/settings.js'

let button = document.querySelector<HTMLButtonElement>('[data-button=model]')!
let model = document.querySelector<HTMLDivElement>('.model')!
let title = document.querySelector<HTMLHeadingElement>('.model_title')!

let showText = button.innerText
let titleText = title.innerText

button.addEventListener('click', () => {
  show3d.set(!show3d.get())
})

let loading = true
let initialized = false

async function init(): Promise<void> {
  if (initialized) return
  initialized = true

  title.innerText = 'Loading…'
  let { generate3d } = await import('./model.js')
  if (!loading) await delay(400)
  title.innerText = titleText

  generate3d(showP3.get(), showRec2020.get())
  showP3.listen(() => {
    generate3d(showP3.get(), showRec2020.get())
  })
  showRec2020.listen(() => {
    generate3d(showP3.get(), showRec2020.get())
  })
}

show3d.subscribe(async value => {
  if (value) init()
  model.classList.toggle('is-shown', value)
  model.setAttribute('aria-hidden', value ? 'false' : 'true')
  button.innerText = value ? 'Hide 3D model' : showText
})

setTimeout(() => {
  loading = false
}, 500)
