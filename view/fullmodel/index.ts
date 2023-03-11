import { registerCamera, syncCamerasFrom } from '../../lib/cameras.js'
import { toggleVisibility } from '../../lib/dom.js'
import { generateLoader } from '../../lib/loader.js'
import { getButton } from '../button/index.js'
import { url } from '../../stores/url.js'

let model = document.querySelector<HTMLDivElement>('.fullmodel')!
let status = document.querySelector<HTMLDivElement>('.fullmodel_status')!
let canvas = document.querySelector<HTMLCanvasElement>('.fullmodel_canvas')!

let load = generateLoader(status, () => import('../../lib/model.js'))

getButton('close3d')?.addEventListener('click', () => {
  url.set('main')
})

let opened = false
url.subscribe(async value => {
  toggleVisibility(model, value === '3d')
  if (value === '3d') {
    opened = true
    load(({ initCanvas }) => {
      registerCamera(initCanvas(canvas, true), 'full')
    })
  } else if (opened) {
    syncCamerasFrom('full')
    opened = false
  }
})
