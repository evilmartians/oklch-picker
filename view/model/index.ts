import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  MeshBasicMaterial,
  BufferAttribute,
  BufferGeometry,
  Vector3,
  Points,
  Camera
} from 'three'
import { Rgb, P3, Rec2020 } from 'culori'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'

import { oklch, lch } from '../../lib/colors.js'
import { showP3, showRec2020 } from '../../stores/settings.js'

interface ModelData {
  coordinates: Vector3[]
  colors: Rgb['r'][] | Rgb['g'][] | Rgb['b'][]
}

let scene: Scene
let camera: Camera
let renderer: WebGLRenderer
let controls: TrackballControls

//let modelCard = document.querySelector<HTMLDivElement>('.chart.is-model')!
let canvas = document.querySelector<HTMLCanvasElement>('.model_canvas')!

function init(): void {
  scene = new Scene()
  camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  renderer = new WebGLRenderer({
    canvas
  })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(350, 210)
  renderer.setClearColor(0xffffff, 0)
  camera.position.setZ(1)
  camera.position.setX(2)
  camera.position.setY(1)
  controls = new TrackballControls(camera, renderer.domElement)
}

function getModelData(): ModelData {
  let coordinates = []
  let colors = []

  let mode: Rgb['mode'] | P3['mode'] | Rec2020['mode'] = 'rgb'
  if (showRec2020.get()) {
    mode = 'rec2020'
  } else if (showP3.get()) {
    mode = 'p3'
  }

  for (let x = 0; x <= 1; x += 0.01) {
    for (let y = 0; y <= 1; y += 0.01) {
      for (let z = 0; z <= 1; z += 0.01) {
        let rgb: Rgb | P3 | Rec2020 = { mode, r: x, g: y, b: z }
        let color
        LCH ? (color = lch(rgb)) : (color = oklch(rgb))
        if (!color.h) color.h = 0
        coordinates.push(new Vector3(color.l, color.c * 2, color.h / 360))
        colors.push(rgb.r, rgb.g, rgb.b)
      }
    }
  }

  return { coordinates, colors }
}

function addPoints(): void {
  let modelData = getModelData()
  let geometry = new BufferGeometry().setFromPoints(modelData.coordinates)
  let color = new Float32Array(modelData.colors)
  geometry.setAttribute('color', new BufferAttribute(color, 3))
  let material = new MeshBasicMaterial({ vertexColors: true })
  let points = new Points(geometry, material)
  scene.add(points)
}

function animate(): void {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

export function generateModel():void {
  init()
  addPoints()
  animate()
}

generateModel()

