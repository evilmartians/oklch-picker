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
let camera: Camera
let renderer: WebGLRenderer
let controls: TrackballControls

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
  LCH ? camera.position.setZ(50) : camera.position.setZ(1)
  LCH ? camera.position.setX(300) : camera.position.setX(2)
  LCH ? camera.position.setY(200) : camera.position.setY(1)
  controls = new TrackballControls(camera, renderer.domElement)
  LCH ? (controls.minDistance = 400) : (controls.minDistance = 0)
  LCH ? (controls.maxDistance = 400) : (controls.maxDistance = 8)
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
        if (!color.h) {
          color.h = 0
        }
        if (
          color.h &&
          (rgb.r === 0 ||
            rgb.g === 0 ||
            rgb.b === 0 ||
            rgb.r > 0.99 ||
            rgb.g > 0.99 ||
            rgb.b > 0.99)
        ) {
          LCH
            ? coordinates.push(new Vector3(color.l, color.c, color.h))
            : coordinates.push(new Vector3(color.l, color.c * 2, color.h / 360))
          colors.push(rgb.r, rgb.g, rgb.b)
        }
      }
    }
  }

  coordinates.push(new Vector3(0, 0, 0))
  coordinates.push(new Vector3(0, 1, 0))
  coordinates.push(new Vector3(0, 0, 1))
  coordinates.push(new Vector3(1, 0, 0))
  coordinates.push(new Vector3(1, 1, 0))
  coordinates.push(new Vector3(1, 0, 1))
  coordinates.push(new Vector3(1, 1, 1))

  colors.push(0, 0, 0)
  colors.push(0, 0, 0)
  colors.push(0, 0, 0)
  colors.push(1, 1, 1)
  colors.push(1, 1, 1)
  colors.push(1, 1, 1)

  return { coordinates, colors }
}

function generateMesh(): void {
  let modelData = getModelData()
  let geometry = new BufferGeometry().setFromPoints(modelData.coordinates)
  let color = new Float32Array(modelData.colors)
  geometry.setAttribute('color', new BufferAttribute(color, 3))

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
  for (let i = 0; i < 12; i++) {
    let col
    i > 2 ? (col = 0.8) : (col = 0.1)
    planeColor.push(col, col, col)
  }
  let planeColor32 = new Float32Array(planeColor)
  plane.setAttribute('color', new BufferAttribute(planeColor32, 3))

  if ('array' in plane.attributes.position) {
    let position: number[] = []
    for (let i in plane.attributes.position.array) {
      position.push(plane.attributes.position.array[i])
    }
    for (let i = 0; i < 12; i += 3) {
      position[i] += 0.5
    }
    position[1] = 0
    position[4] = 0
    let position32 = new Float32Array(position)
    plane.setAttribute('position', new BufferAttribute(position32, 3))
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
  renderer.render(scene, camera)
}

export function generateModel(): void {
  init()
  generateMesh()
  animate()
}

generateModel()
