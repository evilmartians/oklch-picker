import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  MeshBasicMaterial,
  BufferAttribute,
  BufferGeometry,
  Vector3,
  Mesh,
  PlaneGeometry,
  DoubleSide,
  Camera
} from 'three'
import { Rgb, P3, Rec2020 } from 'culori'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls'
import Delaunator from 'delaunator'

import { oklch, lch } from '../../lib/colors.js'
import { showP3, showRec2020 } from '../../stores/settings.js'

interface ModelData {
  coordinates: Vector3[]
  colors: Rgb['r'][] | Rgb['g'][] | Rgb['b'][]
}

let scene: Scene
let camera: Camera | undefined
let renderer: WebGLRenderer
let controls: TrackballControls

let cameraPosition: Vector3 | undefined

let canvas = document.querySelector<HTMLCanvasElement>('.model_canvas')!

function init(): void {
  scene = new Scene()
  camera = new PerspectiveCamera(75, 3, 0.1, 1000)
  renderer = new WebGLRenderer({
    canvas
  })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(950, 610)
  //renderer.setClearColor(0xffffff, 0)
  camera.position.setZ(1)
  camera.position.setX(2)
  camera.position.setY(1)
  controls = new TrackballControls(camera, renderer.domElement)
  controls.minDistance = 1
  controls.maxDistance = 3
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
        if (
          rgb.r === 0 ||
          rgb.g === 0 ||
          rgb.b === 0 ||
          rgb.r > 0.99 ||
          rgb.g > 0.99 ||
          rgb.b > 0.99
        ) {
          LCH ? (color = lch(rgb)) : (color = oklch(rgb))
          if (color.h) {
            LCH
              ? coordinates.push(
                  new Vector3(color.l / 100, color.c / 100, color.h / 100)
                )
              : coordinates.push(
                  new Vector3(color.l, color.c * 1.5, color.h / 360)
                )
            colors.push(rgb.r, rgb.g, rgb.b)
          }
        }
      }
    }
  }

  let bounds = [
    [0, 0, 0],
    [0, 0, 1],
    [1, 0, 0],
    [1, 1, 0],
    [1, 0, 1]
  ]
  LCH
    ? bounds.push([0, 0, 3.7], [1, 0, 3.7])
    : bounds.push([1, 0, 1], [1, 1, 1])
  for (let i of bounds) {
    coordinates.push(new Vector3(...i))
    colors.push(i[0], i[0], i[0])
  }

  return { coordinates, colors }
}

function generateMesh(): void {
  let modelData = getModelData()
  let geometry = new BufferGeometry().setFromPoints(modelData.coordinates)
  let color = new Float32Array(modelData.colors)
  geometry.setAttribute('color', new BufferAttribute(color, 3))
  geometry.center()

  let indexDel = Delaunator.from(
    modelData.coordinates.map(c => {
      return [c.x, c.z]
    })
  )
  let meshIndex = []
  for (let i in indexDel.triangles) {
    meshIndex.push(indexDel.triangles[i])
  }
  geometry.setIndex(meshIndex)
  geometry.computeVertexNormals()

  let material = new MeshBasicMaterial({ vertexColors: true })
  let mesh = new Mesh(geometry, material)
  scene.add(mesh)

  let plane = new PlaneGeometry(1, 2)
  let planeColor = []
  for (let i = 0; i < 2; i++) {
    planeColor.push(0, 0, 0)
    planeColor.push(1, 1, 1)
  }
  let planeColor32 = new Float32Array(planeColor)
  plane.setAttribute('color', new BufferAttribute(planeColor32, 3))

  if ('array' in plane.attributes.position) {
    let position: number[] = Array.from(plane.attributes.position.array)
    let boundary
    LCH ? (boundary = 1.85) : (boundary = 0.5)
    position[1] = boundary
    position[4] = boundary
    position[7] = -boundary
    position[10] = -boundary
    let position32 = new Float32Array(position)
    plane.setAttribute('position', new BufferAttribute(position32, 3))
  }
  if (!LCH) plane.translate(0, 0, -0.5)
  else {
    let translate = -0.65
    if (showP3.get()) translate = -0.73
    if (showRec2020.get()) translate = -0.96
    plane.translate(0, 0, translate)
  }
  let planeMat = new MeshBasicMaterial({
    vertexColors: true,
    side: DoubleSide
  })
  let planeMesh = new Mesh(plane, planeMat)
  planeMesh.rotateX(-Math.PI * 0.5)
  scene.add(planeMesh)
}

function animate(): void {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera!)
}

export function generateModel(): void {
  if (camera) {
    cameraPosition = camera.position
  }
  init()
  generateMesh()
  animate()
  if (cameraPosition) {
    camera!.position.setZ(cameraPosition.z)
    camera!.position.setX(cameraPosition.x)
    camera!.position.setY(cameraPosition.y)
  }
}

generateModel()
