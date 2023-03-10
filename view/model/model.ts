import type { Rgb, P3, Rec2020 } from 'culori/fn'

import {
  MeshBasicMaterial,
  PerspectiveCamera,
  BufferAttribute,
  BufferGeometry,
  PlaneGeometry,
  WebGLRenderer,
  DoubleSide,
  Vector3,
  Camera,
  Scene,
  Mesh
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Delaunator from 'delaunator'

import { oklch, lch } from '../../lib/colors.js'

interface ModelData {
  coordinates: Vector3[]
  colors: Rgb['r'][] | Rgb['g'][] | Rgb['b'][]
}

let scene: Scene
let camera: Camera | undefined
let renderer: WebGLRenderer
let controls: OrbitControls

let cameraPosition: Vector3 | undefined

let canvas = document.querySelector<HTMLCanvasElement>('.model_canvas')!
let canvasWidth = canvas.clientWidth
let canvasHeight = canvas.clientHeight

function init(): void {
  scene = new Scene()
  camera = new PerspectiveCamera(75, 2, 0.1, 1000)
  renderer = new WebGLRenderer({ canvas, alpha: true })

  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvasWidth, canvasHeight)
  camera.position.set(1, 0, 1)
  camera.lookAt(new Vector3(0, 1, 0))

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = false
  controls.enableZoom = false
}

let addColor: (coordinates: Vector3[], rgb: Rgb | P3 | Rec2020) => void

if (LCH) {
  addColor = (coordinates, rgb) => {
    let color = lch(rgb)
    coordinates.push(
      new Vector3(color.l / 100, color.c / 100, (color.h ?? 0) / 100)
    )
  }
} else {
  addColor = (coordinates, rgb) => {
    let color = oklch(rgb)
    coordinates.push(new Vector3(color.l, color.c * 2, (color.h ?? 0) / 360))
  }
}

function getModelData(mode: 'rgb' | 'rec2020' | 'p3'): ModelData {
  let coordinates: Vector3[] = []
  let colors: number[] = []

  for (let x = 0; x <= 1; x += 0.01) {
    for (let y = 0; y <= 1; y += 0.01) {
      for (let z = 0; z <= 1; z += 0.01) {
        let rgb: Rgb | P3 | Rec2020 = { mode, r: x, g: y, b: z }
        if (
          rgb.r === 0 ||
          rgb.g === 0 ||
          rgb.b === 0 ||
          rgb.r > 0.99 ||
          rgb.g > 0.99 ||
          rgb.b > 0.99
        ) {
          addColor(coordinates, rgb)
          colors.push(rgb.r, rgb.g, rgb.b)
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

function generateMesh(p3: boolean, rec2020: boolean): void {
  let mode: 'rgb' | 'rec2020' | 'p3' = 'rgb'
  if (rec2020) {
    mode = 'rec2020'
  } else if (p3) {
    mode = 'p3'
  }

  let modelData = getModelData(mode)
  let geometry = new BufferGeometry().setFromPoints(modelData.coordinates)
  let color = new Float32Array(modelData.colors)
  geometry.setAttribute('color', new BufferAttribute(color, 3))
  geometry.center()

  let indexDel = Delaunator.from(modelData.coordinates.map(c => [c.x, c.z]))
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
  if (!LCH) {
    plane.translate(0, 0, -0.5)
  } else {
    let translate = -0.65
    if (p3) translate = -0.73
    if (rec2020) translate = -0.96
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

export function generate3d(p3: boolean, rec2020: boolean): void {
  if (camera) cameraPosition = camera.position

  init()
  generateMesh(p3, rec2020)
  animate()

  if (cameraPosition && camera) {
    camera.position.setZ(cameraPosition.z)
    camera.position.setX(cameraPosition.x)
    camera.position.setY(cameraPosition.y)
  }
}
