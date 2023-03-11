import { delay } from 'nanodelay'

import { showP3, showRec2020, show3d } from '../../stores/settings.js'

let model = document.querySelector<HTMLDivElement>('.model')!
let title = document.querySelector<HTMLHeadingElement>('.model_title')!

let titleText = title.innerText

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
})

setTimeout(() => {
  loading = false
}, 500)
