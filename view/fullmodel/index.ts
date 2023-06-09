import { registerCamera, syncCamerasFrom } from '../../lib/cameras.js'
import { toggleVisibility } from '../../lib/dom.js'
import { generateLoader } from '../../lib/loader.js'
import type { Model } from '../../lib/model.js'
import { url } from '../../stores/url.js'
import { getButton } from '../button/index.js'

let block = document.querySelector<HTMLDivElement>('.fullmodel')!
let status = document.querySelector<HTMLDivElement>('.fullmodel_status')!
let canvas = document.querySelector<HTMLCanvasElement>('.fullmodel_canvas')!

let load = generateLoader(status, () => import('../../lib/model.js'))

getButton('close3d')?.addEventListener('click', () => {
  url.set('main')
})

let model: Model | undefined

url.subscribe(async value => {
  toggleVisibility(block, value === '3d')
  if (value === '3d') {
    if (!model) {
      load(({ initCanvas }) => {
        model = initCanvas(canvas, true)
        registerCamera(model.camera, 'full')
      })
    } else {
      model.start()
    }
  } else if (model?.started) {
    syncCamerasFrom('full')
    model.stop()
  }
})
