import { registerCamera, syncCamerasFrom } from '../../lib/cameras.ts'
import { toggleVisibility } from '../../lib/dom.ts'
import { generateLoader } from '../../lib/loader.ts'
import type { Model } from '../../lib/model.ts'
import { url } from '../../stores/url.ts'
import { getButton } from '../button/index.ts'

let block = document.querySelector<HTMLDivElement>('.fullmodel')!
let status = document.querySelector<HTMLDivElement>('.fullmodel_status')!
let canvas = document.querySelector<HTMLCanvasElement>('.fullmodel_canvas')!

let load = generateLoader(status, () => import('../../lib/model.ts'))

getButton('close3d')?.addEventListener('click', () => {
  url.set('main')
})

let model: Model | undefined

url.subscribe(value => {
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
